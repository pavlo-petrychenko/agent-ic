import { WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ListPromptsUseCase } from '@/modules/prompts/use-cases/list-prompts.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { IdService } from '@/platform/ids/services/id.service';
import {
  TEST_FOLDER_NEW_NAME,
  TEST_PROMPT_NAME,
  TEST_PROMPT_NEW_NAME,
} from '@test/support/constants/prompts-testing.constants';
import {
  createPromptsTestingModule,
  promptsCtx,
  publicPromptFolderId,
  publicPromptId,
  seedPrompt,
  seedPromptFolder,
  seedPromptVersion,
} from '@test/support/helpers/prompts-testing.helpers';

describe('ListPromptsUseCase', () => {
  let testingModule: TestingModule;
  let listPrompts: ListPromptsUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    listPrompts = testingModule.get(ListPromptsUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('lists every prompt of the workspace in creation order with public ids', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const alpha = await seedPrompt(testingModule, workspaceId, folderId, { name: 'Alpha' });
    const bravo = await seedPrompt(testingModule, workspaceId, folderId, { name: 'Bravo' });

    const listed = await listPrompts.execute(promptsCtx(testingModule, workspaceId), {});

    expect(listed.map((prompt) => prompt.id)).toEqual([
      publicPromptId(testingModule, alpha),
      publicPromptId(testingModule, bravo),
    ]);
    expect(listed.map((prompt) => prompt.name)).toEqual(['Alpha', 'Bravo']);
    expect(listed.map((prompt) => prompt.folderId)).toEqual([
      publicPromptFolderId(testingModule, folderId),
      publicPromptFolderId(testingModule, folderId),
    ]);
  });

  it('reports the latest version number of every prompt, and null without versions', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const withVersions = await seedPrompt(testingModule, workspaceId, folderId, {
      name: 'Alpha',
    });
    await seedPrompt(testingModule, workspaceId, folderId, { name: 'Bravo' });
    await seedPromptVersion(testingModule, workspaceId, withVersions, { number: 1 });
    await seedPromptVersion(testingModule, workspaceId, withVersions, { number: 2 });
    await seedPromptVersion(testingModule, workspaceId, withVersions, { number: 3 });

    const listed = await listPrompts.execute(promptsCtx(testingModule, workspaceId), {});

    expect(listed.map((prompt) => prompt.latestVersionNumber)).toEqual([3, null]);
  });

  it('filters by folder and searches by name across folders, ignoring case', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const otherFolderId = await seedPromptFolder(testingModule, workspaceId, {
      name: TEST_FOLDER_NEW_NAME,
    });
    const receptionist = await seedPrompt(testingModule, workspaceId, folderId, {
      name: TEST_PROMPT_NAME,
    });
    const concierge = await seedPrompt(testingModule, workspaceId, folderId, {
      name: TEST_PROMPT_NEW_NAME,
    });
    const answers = await seedPrompt(testingModule, workspaceId, otherFolderId, {
      name: 'Reception answers',
    });
    const ctx = promptsCtx(testingModule, workspaceId);

    const inFolder = await listPrompts.execute(ctx, {
      folderId: publicPromptFolderId(testingModule, folderId),
    });
    const searched = await listPrompts.execute(ctx, { search: 'rEcEpTiOn' });

    expect(inFolder.map((prompt) => prompt.id)).toEqual([
      publicPromptId(testingModule, receptionist),
      publicPromptId(testingModule, concierge),
    ]);
    expect(searched.map((prompt) => prompt.id)).toEqual([
      publicPromptId(testingModule, receptionist),
      publicPromptId(testingModule, answers),
    ]);
  });

  it('refuses an operator', async () => {
    const attempt = listPrompts.execute(
      promptsCtx(testingModule, ids.generate(), WorkspaceRole.Operator),
      {},
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
