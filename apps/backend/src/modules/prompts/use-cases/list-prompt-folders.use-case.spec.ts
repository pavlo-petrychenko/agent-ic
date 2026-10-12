import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { ListPromptFoldersUseCase } from '@/modules/prompts/use-cases/list-prompt-folders.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { PROMPTS_TEST_LATER } from '@test/support/constants/prompts-testing.constants';
import { newFolder } from '@test/support/fixtures/prompts.fixture';
import {
  createPromptsTestingModule,
  promptsCtx,
} from '@test/support/helpers/prompts-testing.helpers';

describe('ListPromptFoldersUseCase', () => {
  let testingModule: TestingModule;
  let listFolders: ListPromptFoldersUseCase;
  let folders: PromptFoldersRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    listFolders = testingModule.get(ListPromptFoldersUseCase);
    folders = testingModule.get(PromptFoldersRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const seedFolder = async (workspaceId: string, name: string): Promise<string> => {
    const folderId = ids.generate();
    await tenants.run(workspaceId, () =>
      folders.insert(newFolder(folderId, workspaceId, { name })),
    );
    return folderId;
  };

  it('lists folders ordered by name with public ids', async () => {
    const workspaceId = ids.generate();
    const zulu = await seedFolder(workspaceId, 'Zulu');
    const alpha = await seedFolder(workspaceId, 'Alpha');

    const listed = await listFolders.execute(promptsCtx(testingModule, workspaceId));

    expect(listed.map((folder) => folder.name)).toEqual(['Alpha', 'Zulu']);
    expect(listed.map((folder) => folder.id)).toEqual([
      ids.toPublic(IdPrefix.PromptFolder, alpha),
      ids.toPublic(IdPrefix.PromptFolder, zulu),
    ]);
  });

  it('hides a deleted folder', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId, 'Q&A');
    await tenants.run(workspaceId, () =>
      folders.softDelete(workspaceId, folderId, PROMPTS_TEST_LATER),
    );

    const listed = await listFolders.execute(promptsCtx(testingModule, workspaceId));

    expect(listed).toEqual([]);
  });

  it('never shows the folders of another workspace', async () => {
    const workspaceA = ids.generate();
    const workspaceB = ids.generate();
    await seedFolder(workspaceA, 'Q&A');

    const listed = await listFolders.execute(promptsCtx(testingModule, workspaceB));

    expect(listed).toEqual([]);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();

    const attempt = listFolders.execute(
      promptsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
