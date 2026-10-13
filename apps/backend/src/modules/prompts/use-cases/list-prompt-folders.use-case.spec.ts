import { WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { ListPromptFoldersUseCase } from '@/modules/prompts/use-cases/list-prompt-folders.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { PROMPTS_TEST_LATER } from '@test/support/constants/prompts-testing.constants';
import {
  createPromptsTestingModule,
  promptsCtx,
  publicPromptFolderId,
  seedPromptFolder,
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

  it('lists folders ordered by name with public ids', async () => {
    const workspaceId = ids.generate();
    const zulu = await seedPromptFolder(testingModule, workspaceId, { name: 'Zulu' });
    const alpha = await seedPromptFolder(testingModule, workspaceId, { name: 'Alpha' });

    const listed = await listFolders.execute(promptsCtx(testingModule, workspaceId));

    expect(listed.map((folder) => folder.name)).toEqual(['Alpha', 'Zulu']);
    expect(listed.map((folder) => folder.id)).toEqual([
      publicPromptFolderId(testingModule, alpha),
      publicPromptFolderId(testingModule, zulu),
    ]);
  });

  it('hides a deleted folder', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    await tenants.run(workspaceId, () =>
      folders.softDelete(workspaceId, folderId, PROMPTS_TEST_LATER),
    );

    const listed = await listFolders.execute(promptsCtx(testingModule, workspaceId));

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
