import { ErrorReason, IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptFolderNotFoundError } from '@/modules/prompts/errors/prompt-folder-not-found.error';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { DeletePromptFolderUseCase } from '@/modules/prompts/use-cases/delete-prompt-folder.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { InvalidIdError } from '@/platform/ids/errors/invalid-id.error';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_FOLDER_NAME } from '@test/support/constants/prompts-testing.constants';
import { newFolder, newPrompt } from '@test/support/fixtures/prompts.fixture';
import {
  createPromptsTestingModule,
  promptsCtx,
} from '@test/support/helpers/prompts-testing.helpers';

describe('DeletePromptFolderUseCase', () => {
  let testingModule: TestingModule;
  let deleteFolder: DeletePromptFolderUseCase;
  let folders: PromptFoldersRepository;
  let prompts: PromptsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    deleteFolder = testingModule.get(DeletePromptFolderUseCase);
    folders = testingModule.get(PromptFoldersRepository);
    prompts = testingModule.get(PromptsRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const seedFolder = async (workspaceId: string): Promise<string> => {
    const folderId = ids.generate();
    await tenants.run(workspaceId, () => folders.insert(newFolder(folderId, workspaceId)));
    return folderId;
  };

  const seedPrompt = async (workspaceId: string, folderId: string): Promise<string> => {
    const promptId = ids.generate();
    await tenants.run(workspaceId, () =>
      prompts.insert(newPrompt(promptId, workspaceId, { folderId })),
    );
    return promptId;
  };

  const publicFolderId = (folderId: string): string =>
    ids.toPublic(IdPrefix.PromptFolder, folderId);

  it('soft deletes the folder and frees its name', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const id = publicFolderId(folderId);

    const result = await deleteFolder.execute(promptsCtx(testingModule, workspaceId), { id });

    const found = await tenants.run(workspaceId, () => folders.findById(workspaceId, folderId));
    const byName = await tenants.run(workspaceId, () =>
      folders.findByName(workspaceId, TEST_FOLDER_NAME),
    );
    expect(result).toEqual({ id });
    expect(found).toBeNull();
    expect(byName).toBeNull();
  });

  it('moves the prompts of the folder back to Unfiled', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId);

    await deleteFolder.execute(promptsCtx(testingModule, workspaceId), {
      id: publicFolderId(folderId),
    });

    const prompt = await tenants.run(workspaceId, () => prompts.findById(workspaceId, promptId));
    expect(prompt?.folderId).toBeNull();
  });

  it('refuses an unknown folder', async () => {
    const workspaceId = ids.generate();

    const attempt = deleteFolder.execute(promptsCtx(testingModule, workspaceId), {
      id: publicFolderId(ids.generate()),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
  });

  it('refuses deleting the same folder twice', async () => {
    const workspaceId = ids.generate();
    const ctx = promptsCtx(testingModule, workspaceId);
    const id = publicFolderId(await seedFolder(workspaceId));

    await deleteFolder.execute(ctx, { id });
    const attempt = deleteFolder.execute(ctx, { id });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
  });

  it('never deletes the folder of another workspace', async () => {
    const workspaceA = ids.generate();
    const workspaceB = ids.generate();
    const folderId = await seedFolder(workspaceA);

    const attempt = deleteFolder.execute(promptsCtx(testingModule, workspaceB), {
      id: publicFolderId(folderId),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
    const stored = await tenants.run(workspaceA, () => folders.findById(workspaceA, folderId));
    expect(stored).not.toBeNull();
  });

  it('rejects an empty id', async () => {
    const attempt = deleteFolder.execute(promptsCtx(testingModule, ids.generate()), { id: '' });

    await expect(attempt).rejects.toMatchObject({
      fields: [{ path: 'id', reason: ErrorReason.InvalidId }],
    });
  });

  it('rejects a malformed id', async () => {
    const attempt = deleteFolder.execute(promptsCtx(testingModule, ids.generate()), { id: 'nope' });

    await expect(attempt).rejects.toBeInstanceOf(InvalidIdError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);

    const attempt = deleteFolder.execute(
      promptsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { id: publicFolderId(folderId) },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
