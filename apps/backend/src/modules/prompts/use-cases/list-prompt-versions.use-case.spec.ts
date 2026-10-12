import { IdPrefix } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { ListPromptVersionsUseCase } from '@/modules/prompts/use-cases/list-prompt-versions.use-case';
import { IdService } from '@/platform/ids/services/id.service';
import {
  TEST_PROMPT_AUTHOR_NAME,
  TEST_PROMPT_NOTE,
  TEST_PROMPT_TEXT,
} from '@test/support/constants/prompts-testing.constants';
import {
  createPromptsTestingModule,
  promptsCtx,
  publicPromptId,
  seedPrompt,
  seedPromptAuthor,
  seedPromptFolder,
  seedPromptVersion,
} from '@test/support/helpers/prompts-testing.helpers';

const FIRST_NUMBER = 1;
const SECOND_NUMBER = 2;

describe('ListPromptVersionsUseCase', () => {
  let testingModule: TestingModule;
  let listVersions: ListPromptVersionsUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    listVersions = testingModule.get(ListPromptVersionsUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('lists the versions newest first with public ids and authors', async () => {
    const workspaceId = ids.generate();
    const authorId = await seedPromptAuthor(testingModule);
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);
    await seedPromptVersion(testingModule, workspaceId, promptId, {
      number: FIRST_NUMBER,
      text: 'First version text',
      note: TEST_PROMPT_NOTE,
      authorId,
    });
    const secondId = await seedPromptVersion(testingModule, workspaceId, promptId, {
      number: SECOND_NUMBER,
      text: TEST_PROMPT_TEXT,
      note: null,
    });

    const listed = await listVersions.execute(promptsCtx(testingModule, workspaceId), {
      promptId: publicPromptId(testingModule, promptId),
    });

    expect(listed.map((version) => version.number)).toEqual([SECOND_NUMBER, FIRST_NUMBER]);
    expect(listed.map((version) => version.author)).toEqual([
      null,
      { name: TEST_PROMPT_AUTHOR_NAME },
    ]);
    expect(listed[0]).toMatchObject({
      id: ids.toPublic(IdPrefix.PromptVersion, secondId),
      text: TEST_PROMPT_TEXT,
      note: null,
    });
    expect(listed[1]?.note).toBe(TEST_PROMPT_NOTE);
  });

  it('refuses an unknown prompt', async () => {
    const attempt = listVersions.execute(promptsCtx(testingModule, ids.generate()), {
      promptId: publicPromptId(testingModule, ids.generate()),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
  });
});
