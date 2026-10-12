import {
  ErrorReason,
  IdPrefix,
  PROMPT_FOLDER_NAME_MAX_LENGTH,
  WorkspaceRole,
} from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptFolderNameTakenError } from '@/modules/prompts/errors/prompt-folder-name-taken.error';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { CreatePromptFolderUseCase } from '@/modules/prompts/use-cases/create-prompt-folder.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  PROMPTS_TEST_LATER,
  TEST_FOLDER_NAME,
} from '@test/support/constants/prompts-testing.constants';
import {
  createPromptsTestingModule,
  promptsCtx,
} from '@test/support/helpers/prompts-testing.helpers';

const PADDED_NAME = `  ${TEST_FOLDER_NAME}  `;
const CONCURRENT_CREATES = 3;

describe('CreatePromptFolderUseCase', () => {
  let testingModule: TestingModule;
  let createFolder: CreatePromptFolderUseCase;
  let folders: PromptFoldersRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    createFolder = testingModule.get(CreatePromptFolderUseCase);
    folders = testingModule.get(PromptFoldersRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('creates a folder and returns it with a public id', async () => {
    const workspaceId = ids.generate();

    const view = await createFolder.execute(
      promptsCtx(testingModule, workspaceId, WorkspaceRole.Builder),
      { name: PADDED_NAME },
    );

    const stored = await tenants.run(workspaceId, () =>
      folders.findById(workspaceId, ids.fromPublic(IdPrefix.PromptFolder, view.id)),
    );
    expect(view.name).toBe(TEST_FOLDER_NAME);
    expect(view.createdAt).toBeInstanceOf(Date);
    expect(stored).toMatchObject({ name: TEST_FOLDER_NAME, workspaceId, deletedAt: null });
  });

  it('refuses a name already used in the workspace, ignoring case', async () => {
    const workspaceId = ids.generate();
    const ctx = promptsCtx(testingModule, workspaceId);
    await createFolder.execute(ctx, { name: TEST_FOLDER_NAME });

    const attempt = createFolder.execute(ctx, { name: TEST_FOLDER_NAME.toUpperCase() });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNameTakenError);
  });

  it('frees the name again once the folder is deleted', async () => {
    const workspaceId = ids.generate();
    const ctx = promptsCtx(testingModule, workspaceId);
    const first = await createFolder.execute(ctx, { name: TEST_FOLDER_NAME });
    await tenants.run(workspaceId, () =>
      folders.softDelete(
        workspaceId,
        ids.fromPublic(IdPrefix.PromptFolder, first.id),
        PROMPTS_TEST_LATER,
      ),
    );

    const second = await createFolder.execute(ctx, { name: TEST_FOLDER_NAME });

    expect(second.name).toBe(TEST_FOLDER_NAME);
    expect(second.id).not.toBe(first.id);
  });

  it('allows the same name in another workspace', async () => {
    await createFolder.execute(promptsCtx(testingModule, ids.generate()), {
      name: TEST_FOLDER_NAME,
    });

    const other = await createFolder.execute(promptsCtx(testingModule, ids.generate()), {
      name: TEST_FOLDER_NAME,
    });

    expect(other.name).toBe(TEST_FOLDER_NAME);
  });

  it('lets exactly one of several identical creates win', async () => {
    const ctx = promptsCtx(testingModule, ids.generate());

    const outcomes = await Promise.all(
      Array.from({ length: CONCURRENT_CREATES }, async () => {
        try {
          await createFolder.execute(ctx, { name: TEST_FOLDER_NAME });
          return 'created';
        } catch (error) {
          if (error instanceof PromptFolderNameTakenError) {
            return 'refused';
          }
          throw error;
        }
      }),
    );

    expect(outcomes.filter((outcome) => outcome === 'created')).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome === 'refused')).toHaveLength(
      CONCURRENT_CREATES - 1,
    );
  });

  it.each([
    ['', ErrorReason.InvalidRequest],
    ['   ', ErrorReason.InvalidRequest],
    ['x'.repeat(PROMPT_FOLDER_NAME_MAX_LENGTH + 1), ErrorReason.InvalidRequest],
  ])('rejects the name %j', async (name, reason) => {
    const attempt = createFolder.execute(promptsCtx(testingModule, ids.generate()), { name });

    await expect(attempt).rejects.toMatchObject({
      fields: [{ path: 'name', reason }],
    });
  });

  it('refuses an operator', async () => {
    const attempt = createFolder.execute(
      promptsCtx(testingModule, ids.generate(), WorkspaceRole.Operator),
      { name: TEST_FOLDER_NAME },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
