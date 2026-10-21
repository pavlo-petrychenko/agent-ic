import { ErrorReason, PROMPT_FOLDER_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptFolderNameTakenError } from '@/modules/prompts/errors/prompt-folder-name-taken.error';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { CreatePromptFolderUseCase } from '@/modules/prompts/use-cases/create-prompt-folder.use-case';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { IdService } from '@/platform/ids/services/id.service';
import {
  PROMPTS_TEST_LATER,
  TEST_FOLDER_NAME,
} from '@test/support/constants/prompts-testing.constants';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import {
  createPromptsTestingModule,
  promptsCtx,
  publicPromptFolderId,
  seedPromptFolder,
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
    await ensureWorkspaceRow(testingModule, workspaceId);

    const view = await createFolder.execute(promptsCtx(testingModule, workspaceId), {
      name: PADDED_NAME,
    });

    const stored = await tenants.run(workspaceId, () =>
      folders.findByName(workspaceId, TEST_FOLDER_NAME),
    );
    expect(view.name).toBe(TEST_FOLDER_NAME);
    expect(view.createdAt).toBeInstanceOf(Date);
    expect(view.id).toBe(publicPromptFolderId(testingModule, stored?.id ?? ''));
    expect(stored).toMatchObject({ name: TEST_FOLDER_NAME, workspaceId, deletedAt: null });
  });

  it('refuses a name already used in the workspace, ignoring case', async () => {
    const workspaceId = ids.generate();
    await ensureWorkspaceRow(testingModule, workspaceId);
    const ctx = promptsCtx(testingModule, workspaceId);
    await createFolder.execute(ctx, { name: TEST_FOLDER_NAME });

    const attempt = createFolder.execute(ctx, { name: TEST_FOLDER_NAME.toUpperCase() });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNameTakenError);
    await expect(attempt).rejects.toMatchObject({
      kind: DomainErrorKind.Conflict,
      reason: ErrorReason.PromptFolderNameTaken,
    });
  });

  it('frees the name again once the folder is deleted', async () => {
    const workspaceId = ids.generate();
    await ensureWorkspaceRow(testingModule, workspaceId);
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    await tenants.run(workspaceId, () =>
      folders.softDelete(workspaceId, folderId, PROMPTS_TEST_LATER),
    );

    const view = await createFolder.execute(promptsCtx(testingModule, workspaceId), {
      name: TEST_FOLDER_NAME,
    });

    expect(view.name).toBe(TEST_FOLDER_NAME);
  });

  it('lets exactly one of several identical creates win', async () => {
    const workspaceId = ids.generate();
    await ensureWorkspaceRow(testingModule, workspaceId);
    const ctx = promptsCtx(testingModule, workspaceId);

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
});
