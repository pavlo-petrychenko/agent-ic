import { IdPrefix } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptVersionNotFoundError } from '@/modules/prompts/errors/prompt-version-not-found.error';
import { GetPromptVersionUseCase } from '@/modules/prompts/use-cases/get-prompt-version.use-case';
import { IdService } from '@/platform/ids/services/id.service';
import {
  TEST_PROMPT_AUTHOR_NAME,
  TEST_PROMPT_NOTE,
  TEST_PROMPT_TEXT,
} from '@test/support/constants/prompts-testing.constants';
import { manualClockOf } from '@test/support/helpers/manual-clock.helpers';
import {
  createPromptsTestingModule,
  promptsCtx,
  seedPrompt,
  seedPromptAuthor,
  seedPromptFolder,
  seedPromptVersion,
} from '@test/support/helpers/prompts-testing.helpers';

describe('GetPromptVersionUseCase', () => {
  let testingModule: TestingModule;
  let getVersion: GetPromptVersionUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    getVersion = testingModule.get(GetPromptVersionUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('returns the version with its public id and author', async () => {
    const workspaceId = ids.generate();
    const authorId = await seedPromptAuthor(testingModule);
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);
    const seededAt = manualClockOf(testingModule).now();
    const versionId = await seedPromptVersion(testingModule, workspaceId, promptId, {
      text: TEST_PROMPT_TEXT,
      note: TEST_PROMPT_NOTE,
      authorId,
    });

    const view = await getVersion.execute(promptsCtx(testingModule, workspaceId), {
      id: ids.toPublic(IdPrefix.PromptVersion, versionId),
    });

    expect(view).toMatchObject({
      id: ids.toPublic(IdPrefix.PromptVersion, versionId),
      number: 1,
      text: TEST_PROMPT_TEXT,
      note: TEST_PROMPT_NOTE,
      author: { name: TEST_PROMPT_AUTHOR_NAME },
      createdAt: seededAt,
    });
  });

  it('refuses an unknown version', async () => {
    const attempt = getVersion.execute(promptsCtx(testingModule, ids.generate()), {
      id: ids.toPublic(IdPrefix.PromptVersion, ids.generate()),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptVersionNotFoundError);
  });
});
