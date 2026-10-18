import { WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ListPromptsByFoldersUseCase } from '@/modules/prompts/use-cases/list-prompts-by-folders.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_FOLDER_NEW_NAME } from '@test/support/constants/prompts-testing.constants';
import {
  createPromptsTestingModule,
  promptsCtx,
  publicPromptFolderId,
  publicPromptId,
  seedPrompt,
  seedPromptFolder,
  seedPromptVersion,
} from '@test/support/helpers/prompts-testing.helpers';

describe('ListPromptsByFoldersUseCase', () => {
  let testingModule: TestingModule;
  let listPrompts: ListPromptsByFoldersUseCase;
  let ids: IdService;

  const list = (workspaceId: string, folderIds: readonly string[], role = WorkspaceRole.Owner) =>
    listPrompts.execute(promptsCtx(testingModule, workspaceId, role), folderIds);

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    listPrompts = testingModule.get(ListPromptsByFoldersUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('returns the prompts of every folder, and none for a folder without prompts', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const emptyFolderId = await seedPromptFolder(testingModule, workspaceId, {
      name: TEST_FOLDER_NEW_NAME,
    });
    const receptionist = await seedPrompt(testingModule, workspaceId, folderId, {
      name: 'Receptionist',
    });
    const giftCard = await seedPrompt(testingModule, workspaceId, folderId, { name: 'Gift card' });
    const publicFolderId = publicPromptFolderId(testingModule, folderId);
    const publicEmptyFolderId = publicPromptFolderId(testingModule, emptyFolderId);

    const listed = await list(workspaceId, [publicFolderId, publicEmptyFolderId]);

    expect(listed.get(publicFolderId)?.map((prompt) => prompt.id)).toEqual(
      expect.arrayContaining([
        publicPromptId(testingModule, receptionist),
        publicPromptId(testingModule, giftCard),
      ]),
    );
    expect(listed.get(publicFolderId)?.map((prompt) => prompt.name)).toEqual(
      expect.arrayContaining(['Receptionist', 'Gift card']),
    );
    expect(listed.get(publicEmptyFolderId)).toEqual([]);
    expect([...listed.keys()]).toEqual([publicFolderId, publicEmptyFolderId]);
  });

  it('reports the latest version number of every prompt', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const withVersions = await seedPrompt(testingModule, workspaceId, folderId, {
      name: 'Receptionist',
    });
    const withoutVersions = await seedPrompt(testingModule, workspaceId, folderId, {
      name: 'Gift card',
    });
    await seedPromptVersion(testingModule, workspaceId, withVersions, { number: 1 });
    await seedPromptVersion(testingModule, workspaceId, withVersions, { number: 2 });
    const publicFolderId = publicPromptFolderId(testingModule, folderId);

    const listed = await list(workspaceId, [publicFolderId]);

    expect(
      listed.get(publicFolderId)?.map((prompt) => [prompt.id, prompt.latestVersionNumber]),
    ).toEqual([
      [publicPromptId(testingModule, withVersions), 2],
      [publicPromptId(testingModule, withoutVersions), null],
    ]);
  });

  it('returns no prompts for the folders of another workspace', async () => {
    const workspaceId = ids.generate();
    const otherWorkspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, otherWorkspaceId);
    await seedPrompt(testingModule, otherWorkspaceId, folderId, { name: 'Receptionist' });
    const publicFolderId = publicPromptFolderId(testingModule, folderId);

    const listed = await list(workspaceId, [publicFolderId]);

    expect(listed.get(publicFolderId)).toEqual([]);
  });

  it('refuses an operator', async () => {
    const attempt = list(ids.generate(), [], WorkspaceRole.Operator);

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
