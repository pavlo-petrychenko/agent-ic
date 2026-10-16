import { ErrorReason } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptFolderNotEmptyError } from '@/modules/prompts/errors/prompt-folder-not-empty.error';
import { PromptFolderNotFoundError } from '@/modules/prompts/errors/prompt-folder-not-found.error';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { DeletePromptFolderUseCase } from '@/modules/prompts/use-cases/delete-prompt-folder.use-case';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { IdService } from '@/platform/ids/services/id.service';
import {
  PROMPTS_TEST_LATER,
  TEST_FOLDER_NAME,
} from '@test/support/constants/prompts-testing.constants';
import {
  createPromptsTestingModule,
  promptsCtx,
  publicPromptFolderId,
  seedPrompt,
  seedPromptFolder,
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

  it('soft deletes the folder and frees its name', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const id = publicPromptFolderId(testingModule, folderId);

    const result = await deleteFolder.execute(promptsCtx(testingModule, workspaceId), { id });

    const found = await tenants.run(workspaceId, () => folders.findById(workspaceId, folderId));
    const byName = await tenants.run(workspaceId, () =>
      folders.findByName(workspaceId, TEST_FOLDER_NAME),
    );
    expect(result).toEqual({ id });
    expect(found).toBeNull();
    expect(byName).toBeNull();
  });

  it('refuses to delete a folder that still has prompts', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);

    const attempt = deleteFolder.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptFolderId(testingModule, folderId),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotEmptyError);
    await expect(attempt).rejects.toMatchObject({
      kind: DomainErrorKind.Conflict,
      reason: ErrorReason.PromptFolderNotEmpty,
    });
    const stored = await tenants.run(workspaceId, () => folders.findById(workspaceId, folderId));
    const prompt = await tenants.run(workspaceId, () => prompts.findById(workspaceId, promptId));
    expect(stored).not.toBeNull();
    expect(prompt?.folderId).toBe(folderId);
  });

  it('deletes a folder once its prompts are gone', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);
    await tenants.run(workspaceId, () =>
      prompts.softDelete(workspaceId, promptId, PROMPTS_TEST_LATER),
    );

    await deleteFolder.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptFolderId(testingModule, folderId),
    });

    const stored = await tenants.run(workspaceId, () => folders.findById(workspaceId, folderId));
    expect(stored).toBeNull();
  });

  it('refuses an unknown folder', async () => {
    const workspaceId = ids.generate();

    const attempt = deleteFolder.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptFolderId(testingModule, ids.generate()),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
  });
});
