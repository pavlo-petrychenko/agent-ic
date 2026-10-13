import { ErrorReason, IdPrefix, PROMPT_NAME_MAX_LENGTH, WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptFolderNotFoundError } from '@/modules/prompts/errors/prompt-folder-not-found.error';
import { PromptNameTakenError } from '@/modules/prompts/errors/prompt-name-taken.error';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { CreatePromptUseCase } from '@/modules/prompts/use-cases/create-prompt.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { InvalidIdError } from '@/platform/ids/errors/invalid-id.error';
import { IdService } from '@/platform/ids/services/id.service';
import {
  PROMPTS_TEST_LATER,
  TEST_FOLDER_NAME,
  TEST_PROMPT_NAME,
} from '@test/support/constants/prompts-testing.constants';
import { newFolder } from '@test/support/fixtures/prompts.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createPromptsTestingModule,
  promptsCtx,
} from '@test/support/helpers/prompts-testing.helpers';

const PADDED_NAME = `  ${TEST_PROMPT_NAME}  `;
const CONCURRENT_CREATES = 3;

describe('CreatePromptUseCase', () => {
  let testingModule: TestingModule;
  let createPrompt: CreatePromptUseCase;
  let folders: PromptFoldersRepository;
  let prompts: PromptsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    createPrompt = testingModule.get(CreatePromptUseCase);
    folders = testingModule.get(PromptFoldersRepository);
    prompts = testingModule.get(PromptsRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const seedFolder = async (
    workspaceId: string,
    name: string = TEST_FOLDER_NAME,
  ): Promise<string> => {
    const folderId = ids.generate();
    await tenants.run(workspaceId, () =>
      folders.insert(newFolder(folderId, workspaceId, { name })),
    );
    return folderId;
  };

  const publicFolderId = (folderId: string): string =>
    ids.toPublic(IdPrefix.PromptFolder, folderId);

  it('creates a prompt in a folder and returns it with public ids', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const userId = ids.generate();
    const ctx = workspaceCtx(userId, workspaceId, WorkspaceRole.Builder);

    const view = await createPrompt.execute(ctx, {
      name: PADDED_NAME,
      folderId: publicFolderId(folderId),
    });

    const stored = await tenants.run(workspaceId, () =>
      prompts.findById(workspaceId, ids.fromPublic(IdPrefix.Prompt, view.id)),
    );
    expect(view).toMatchObject({
      name: TEST_PROMPT_NAME,
      folderId: publicFolderId(folderId),
    });
    expect(view.createdAt).toBeInstanceOf(Date);
    expect(stored).toMatchObject({
      name: TEST_PROMPT_NAME,
      folderId,
      createdByUserId: userId,
      deletedAt: null,
    });
  });

  it('refuses a name already used in the workspace, ignoring case', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const ctx = promptsCtx(testingModule, workspaceId);
    await createPrompt.execute(ctx, { name: TEST_PROMPT_NAME, folderId: publicFolderId(folderId) });

    const attempt = createPrompt.execute(ctx, {
      name: TEST_PROMPT_NAME.toUpperCase(),
      folderId: publicFolderId(folderId),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNameTakenError);
  });

  it('allows a name freed by a deleted prompt', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const ctx = promptsCtx(testingModule, workspaceId);
    const first = await createPrompt.execute(ctx, {
      name: TEST_PROMPT_NAME,
      folderId: publicFolderId(folderId),
    });
    await tenants.run(workspaceId, () =>
      prompts.softDelete(
        workspaceId,
        ids.fromPublic(IdPrefix.Prompt, first.id),
        PROMPTS_TEST_LATER,
      ),
    );

    const second = await createPrompt.execute(ctx, {
      name: TEST_PROMPT_NAME,
      folderId: publicFolderId(folderId),
    });

    expect(second.name).toBe(TEST_PROMPT_NAME);
    expect(second.id).not.toBe(first.id);
  });

  it('allows the same name in another workspace', async () => {
    const workspaceA = ids.generate();
    const workspaceB = ids.generate();
    const folderA = await seedFolder(workspaceA);
    const folderB = await seedFolder(workspaceB);

    const first = await createPrompt.execute(promptsCtx(testingModule, workspaceA), {
      name: TEST_PROMPT_NAME,
      folderId: publicFolderId(folderA),
    });
    const other = await createPrompt.execute(promptsCtx(testingModule, workspaceB), {
      name: TEST_PROMPT_NAME,
      folderId: publicFolderId(folderB),
    });

    expect(first.id).not.toBe(other.id);
  });

  it('lets exactly one of several identical creates win', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const ctx = promptsCtx(testingModule, workspaceId);

    const outcomes = await Promise.all(
      Array.from({ length: CONCURRENT_CREATES }, async () => {
        try {
          await createPrompt.execute(ctx, {
            name: TEST_PROMPT_NAME,
            folderId: publicFolderId(folderId),
          });
          return 'created';
        } catch (error) {
          if (error instanceof PromptNameTakenError) {
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

  it('refuses a folder that does not exist', async () => {
    const attempt = createPrompt.execute(promptsCtx(testingModule, ids.generate()), {
      name: TEST_PROMPT_NAME,
      folderId: publicFolderId(ids.generate()),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
  });

  it('refuses a folder of another workspace', async () => {
    const folderId = await seedFolder(ids.generate());

    const attempt = createPrompt.execute(promptsCtx(testingModule, ids.generate()), {
      name: TEST_PROMPT_NAME,
      folderId: publicFolderId(folderId),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
  });

  it('refuses a folder that was deleted', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    await tenants.run(workspaceId, () =>
      folders.softDelete(workspaceId, folderId, PROMPTS_TEST_LATER),
    );

    const attempt = createPrompt.execute(promptsCtx(testingModule, workspaceId), {
      name: TEST_PROMPT_NAME,
      folderId: publicFolderId(folderId),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
  });

  it.each([
    ['', ErrorReason.InvalidRequest],
    ['   ', ErrorReason.InvalidRequest],
    ['x'.repeat(PROMPT_NAME_MAX_LENGTH + 1), ErrorReason.InvalidRequest],
  ])('rejects the name %j', async (name, reason) => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);

    const attempt = createPrompt.execute(promptsCtx(testingModule, workspaceId), {
      name,
      folderId: publicFolderId(folderId),
    });

    await expect(attempt).rejects.toMatchObject({
      fields: [{ path: 'name', reason }],
    });
  });

  it('rejects an empty folder id', async () => {
    const attempt = createPrompt.execute(promptsCtx(testingModule, ids.generate()), {
      name: TEST_PROMPT_NAME,
      folderId: '',
    });

    await expect(attempt).rejects.toMatchObject({
      fields: [{ path: 'folderId', reason: ErrorReason.InvalidId }],
    });
  });

  it('rejects a malformed folder id', async () => {
    const attempt = createPrompt.execute(promptsCtx(testingModule, ids.generate()), {
      name: TEST_PROMPT_NAME,
      folderId: 'nope',
    });

    await expect(attempt).rejects.toBeInstanceOf(InvalidIdError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);

    const attempt = createPrompt.execute(
      promptsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { name: TEST_PROMPT_NAME, folderId: publicFolderId(folderId) },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
