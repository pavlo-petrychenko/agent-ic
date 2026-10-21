import { ErrorReason, IdPrefix } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { GetPromptUseCase } from '@/modules/prompts/use-cases/get-prompt.use-case';
import { IdService } from '@/platform/ids/services/id.service';
import {
  TEST_PROMPT_AUTHOR_NAME,
  TEST_PROMPT_NAME,
  TEST_PROMPT_NOTE,
  TEST_PROMPT_TEXT,
} from '@test/support/constants/prompts-testing.constants';
import { manualClockOf } from '@test/support/helpers/manual-clock.helpers';
import {
  createPromptsTestingModule,
  promptsCtx,
  publicPromptFolderId,
  publicPromptId,
  seedPrompt,
  seedPromptAuthor,
  seedPromptFolder,
  seedPromptVersion,
} from '@test/support/helpers/prompts-testing.helpers';

describe('GetPromptUseCase', () => {
  let testingModule: TestingModule;
  let getPrompt: GetPromptUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    getPrompt = testingModule.get(GetPromptUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('returns the prompt with its latest version', async () => {
    const workspaceId = ids.generate();
    const authorId = await seedPromptAuthor(testingModule);
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);
    const seededAt = manualClockOf(testingModule).now();
    await seedPromptVersion(testingModule, workspaceId, promptId, {
      number: 1,
      text: 'First version text',
      note: 'first',
    });
    const latestId = await seedPromptVersion(testingModule, workspaceId, promptId, {
      number: 2,
      text: TEST_PROMPT_TEXT,
      note: TEST_PROMPT_NOTE,
      authorId,
    });

    const detail = await getPrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(testingModule, promptId),
    });

    expect(detail.prompt).toMatchObject({
      id: publicPromptId(testingModule, promptId),
      name: TEST_PROMPT_NAME,
      folderId: publicPromptFolderId(testingModule, folderId),
      createdAt: seededAt,
      updatedAt: seededAt,
    });
    expect(detail.latestVersion).toMatchObject({
      id: ids.toPublic(IdPrefix.PromptVersion, latestId),
      number: 2,
      text: TEST_PROMPT_TEXT,
      note: TEST_PROMPT_NOTE,
      author: { name: TEST_PROMPT_AUTHOR_NAME },
      createdAt: seededAt,
    });
  });

  it('returns an empty latest version for a prompt with no versions', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);

    const detail = await getPrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(testingModule, promptId),
    });

    expect(detail.prompt.name).toBe(TEST_PROMPT_NAME);
    expect(detail.latestVersion).toBeNull();
  });

  it('refuses an unknown prompt', async () => {
    const attempt = getPrompt.execute(promptsCtx(testingModule, ids.generate()), {
      id: publicPromptId(testingModule, ids.generate()),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
  });

  it('rejects an empty id', async () => {
    const attempt = getPrompt.execute(promptsCtx(testingModule, ids.generate()), { id: '' });

    await expect(attempt).rejects.toMatchObject({
      fields: [{ path: 'id', reason: ErrorReason.InvalidId }],
    });
  });
});
