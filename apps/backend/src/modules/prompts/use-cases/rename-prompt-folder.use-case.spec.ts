import { ErrorReason } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptFolderNameTakenError } from '@/modules/prompts/errors/prompt-folder-name-taken.error';
import { PromptFolderNotFoundError } from '@/modules/prompts/errors/prompt-folder-not-found.error';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { RenamePromptFolderUseCase } from '@/modules/prompts/use-cases/rename-prompt-folder.use-case';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { IdService } from '@/platform/ids/services/id.service';
import {
  PROMPTS_TEST_LATER,
  TEST_FOLDER_NAME,
  TEST_FOLDER_NEW_NAME,
} from '@test/support/constants/prompts-testing.constants';
import {
  createPromptsTestingModule,
  promptsCtx,
  publicPromptFolderId,
  seedPromptFolder,
} from '@test/support/helpers/prompts-testing.helpers';

const PADDED_NAME = `  ${TEST_FOLDER_NEW_NAME}  `;

describe('RenamePromptFolderUseCase', () => {
  let testingModule: TestingModule;
  let renameFolder: RenamePromptFolderUseCase;
  let folders: PromptFoldersRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    renameFolder = testingModule.get(RenamePromptFolderUseCase);
    folders = testingModule.get(PromptFoldersRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('renames a folder and returns the new name', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);

    const view = await renameFolder.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptFolderId(testingModule, folderId),
      name: PADDED_NAME,
    });

    const stored = await tenants.run(workspaceId, () => folders.findById(workspaceId, folderId));
    expect(view).toMatchObject({
      id: publicPromptFolderId(testingModule, folderId),
      name: TEST_FOLDER_NEW_NAME,
    });
    expect(stored?.name).toBe(TEST_FOLDER_NEW_NAME);
  });

  it('allows keeping the same name', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);

    const view = await renameFolder.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptFolderId(testingModule, folderId),
      name: TEST_FOLDER_NAME.toUpperCase(),
    });

    expect(view.name).toBe(TEST_FOLDER_NAME.toUpperCase());
  });

  it('refuses a name taken by another folder, ignoring case', async () => {
    const workspaceId = ids.generate();
    await seedPromptFolder(testingModule, workspaceId);
    const folderId = await seedPromptFolder(testingModule, workspaceId, {
      name: TEST_FOLDER_NEW_NAME,
    });

    const attempt = renameFolder.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptFolderId(testingModule, folderId),
      name: TEST_FOLDER_NAME.toUpperCase(),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNameTakenError);
    await expect(attempt).rejects.toMatchObject({
      kind: DomainErrorKind.Conflict,
      reason: ErrorReason.PromptFolderNameTaken,
    });
  });

  it('allows a name freed by a deleted folder', async () => {
    const workspaceId = ids.generate();
    const deletedFolderId = await seedPromptFolder(testingModule, workspaceId);
    const folderId = await seedPromptFolder(testingModule, workspaceId, {
      name: TEST_FOLDER_NEW_NAME,
    });
    await tenants.run(workspaceId, () =>
      folders.softDelete(workspaceId, deletedFolderId, PROMPTS_TEST_LATER),
    );

    const view = await renameFolder.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptFolderId(testingModule, folderId),
      name: TEST_FOLDER_NAME,
    });

    expect(view.name).toBe(TEST_FOLDER_NAME);
  });

  it('refuses an unknown folder', async () => {
    const attempt = renameFolder.execute(promptsCtx(testingModule, ids.generate()), {
      id: publicPromptFolderId(testingModule, ids.generate()),
      name: TEST_FOLDER_NEW_NAME,
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
  });
});
