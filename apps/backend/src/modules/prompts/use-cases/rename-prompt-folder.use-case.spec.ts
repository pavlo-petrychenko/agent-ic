import {
  ErrorReason,
  IdPrefix,
  PROMPT_FOLDER_NAME_MAX_LENGTH,
  WorkspaceRole,
} from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptFolderNameTakenError } from '@/modules/prompts/errors/prompt-folder-name-taken.error';
import { PromptFolderNotFoundError } from '@/modules/prompts/errors/prompt-folder-not-found.error';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { RenamePromptFolderUseCase } from '@/modules/prompts/use-cases/rename-prompt-folder.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { InvalidIdError } from '@/platform/ids/errors/invalid-id.error';
import { IdService } from '@/platform/ids/services/id.service';
import {
  PROMPTS_TEST_LATER,
  TEST_FOLDER_NAME,
  TEST_FOLDER_NEW_NAME,
} from '@test/support/constants/prompts-testing.constants';
import { newFolder } from '@test/support/fixtures/prompts.fixture';
import {
  createPromptsTestingModule,
  promptsCtx,
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

  it('renames a folder and returns the new name', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);

    const view = await renameFolder.execute(promptsCtx(testingModule, workspaceId), {
      id: publicFolderId(folderId),
      name: PADDED_NAME,
    });

    const stored = await tenants.run(workspaceId, () => folders.findById(workspaceId, folderId));
    expect(view).toMatchObject({ id: publicFolderId(folderId), name: TEST_FOLDER_NEW_NAME });
    expect(stored?.name).toBe(TEST_FOLDER_NEW_NAME);
  });

  it('allows keeping the same name', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);

    const view = await renameFolder.execute(promptsCtx(testingModule, workspaceId), {
      id: publicFolderId(folderId),
      name: TEST_FOLDER_NAME.toUpperCase(),
    });

    expect(view.name).toBe(TEST_FOLDER_NAME.toUpperCase());
  });

  it('refuses a name taken by another folder, ignoring case', async () => {
    const workspaceId = ids.generate();
    await seedFolder(workspaceId);
    const folderId = await seedFolder(workspaceId, TEST_FOLDER_NEW_NAME);

    const attempt = renameFolder.execute(promptsCtx(testingModule, workspaceId), {
      id: publicFolderId(folderId),
      name: TEST_FOLDER_NAME.toUpperCase(),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNameTakenError);
  });

  it('allows a name freed by a deleted folder', async () => {
    const workspaceId = ids.generate();
    const deletedFolderId = await seedFolder(workspaceId);
    const folderId = await seedFolder(workspaceId, TEST_FOLDER_NEW_NAME);
    await tenants.run(workspaceId, () =>
      folders.softDelete(workspaceId, deletedFolderId, PROMPTS_TEST_LATER),
    );

    const view = await renameFolder.execute(promptsCtx(testingModule, workspaceId), {
      id: publicFolderId(folderId),
      name: TEST_FOLDER_NAME,
    });

    expect(view.name).toBe(TEST_FOLDER_NAME);
  });

  it('refuses an unknown folder', async () => {
    const workspaceId = ids.generate();

    const attempt = renameFolder.execute(promptsCtx(testingModule, workspaceId), {
      id: publicFolderId(ids.generate()),
      name: TEST_FOLDER_NEW_NAME,
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
  });

  it('never renames the folder of another workspace', async () => {
    const workspaceA = ids.generate();
    const workspaceB = ids.generate();
    const folderId = await seedFolder(workspaceA);

    const attempt = renameFolder.execute(promptsCtx(testingModule, workspaceB), {
      id: publicFolderId(folderId),
      name: TEST_FOLDER_NEW_NAME,
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
    const stored = await tenants.run(workspaceA, () => folders.findById(workspaceA, folderId));
    expect(stored?.name).toBe(TEST_FOLDER_NAME);
  });

  it.each([
    ['', ErrorReason.InvalidRequest],
    ['   ', ErrorReason.InvalidRequest],
    ['x'.repeat(PROMPT_FOLDER_NAME_MAX_LENGTH + 1), ErrorReason.InvalidRequest],
  ])('rejects the name %j', async (name, reason) => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);

    const attempt = renameFolder.execute(promptsCtx(testingModule, workspaceId), {
      id: publicFolderId(folderId),
      name,
    });

    await expect(attempt).rejects.toMatchObject({
      fields: [{ path: 'name', reason }],
    });
  });

  it('rejects an empty id', async () => {
    const attempt = renameFolder.execute(promptsCtx(testingModule, ids.generate()), {
      id: '',
      name: TEST_FOLDER_NEW_NAME,
    });

    await expect(attempt).rejects.toMatchObject({
      fields: [{ path: 'id', reason: ErrorReason.InvalidId }],
    });
  });

  it('rejects a malformed id', async () => {
    const attempt = renameFolder.execute(promptsCtx(testingModule, ids.generate()), {
      id: 'nope',
      name: TEST_FOLDER_NEW_NAME,
    });

    await expect(attempt).rejects.toBeInstanceOf(InvalidIdError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);

    const attempt = renameFolder.execute(
      promptsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { id: publicFolderId(folderId), name: TEST_FOLDER_NEW_NAME },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
