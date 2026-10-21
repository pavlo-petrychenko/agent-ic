import { ErrorReason, PROMPT_VERSION_NOTE_MAX_LENGTH, WorkspaceRole } from '@agent-ic/contracts';
import { MAX_TEMPLATE_LENGTH } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { SavePromptVersionUseCase } from '@/modules/prompts/use-cases/save-prompt-version.use-case';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { CLOCK_TICK_MS } from '@test/support/constants/manual-clock.constants';
import {
  TEST_PROMPT_AUTHOR_NAME,
  TEST_PROMPT_NAME,
  TEST_PROMPT_NOTE,
  TEST_PROMPT_TEXT,
} from '@test/support/constants/prompts-testing.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { manualClockOf } from '@test/support/helpers/manual-clock.helpers';
import {
  createPromptsTestingModule,
  promptsCtx,
  publicPromptId,
  seedPrompt,
  seedPromptAuthor,
  seedPromptFolder,
} from '@test/support/helpers/prompts-testing.helpers';

describe('SavePromptVersionUseCase', () => {
  let testingModule: TestingModule;
  let saveVersion: SavePromptVersionUseCase;
  let versions: PromptVersionsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    saveVersion = testingModule.get(SavePromptVersionUseCase);
    versions = testingModule.get(PromptVersionsRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const seedPromptForVersion = async (workspaceId: string): Promise<string> => {
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    return seedPrompt(testingModule, workspaceId, folderId);
  };

  it('saves the first and the next version and returns the new detail', async () => {
    const workspaceId = ids.generate();
    const authorId = await seedPromptAuthor(testingModule);
    const ctx = workspaceCtx(authorId, workspaceId, WorkspaceRole.Owner);
    const promptId = await seedPromptForVersion(workspaceId);
    const id = publicPromptId(testingModule, promptId);

    const clock = manualClockOf(testingModule);
    const createdAt = clock.now();
    clock.advanceBy(CLOCK_TICK_MS);
    const first = await saveVersion.execute(ctx, {
      id,
      text: 'First version text',
      note: TEST_PROMPT_NOTE,
    });
    clock.advanceBy(CLOCK_TICK_MS);
    const second = await saveVersion.execute(ctx, { id, text: TEST_PROMPT_TEXT });

    expect(first.latestVersion).toMatchObject({
      number: 1,
      text: 'First version text',
      note: TEST_PROMPT_NOTE,
      author: { name: TEST_PROMPT_AUTHOR_NAME },
    });
    expect(second.latestVersion).toMatchObject({
      number: 2,
      text: TEST_PROMPT_TEXT,
      note: null,
      author: { name: TEST_PROMPT_AUTHOR_NAME },
    });
    expect(first.prompt.updatedAt).toEqual(first.latestVersion?.createdAt);
    expect(second.prompt).toMatchObject({
      id,
      name: TEST_PROMPT_NAME,
      createdAt,
      updatedAt: clock.now(),
    });
    expect(second.latestVersion?.createdAt).toEqual(clock.now());

    const stored = await tenants.run(workspaceId, () =>
      versions.listByPrompt(workspaceId, promptId),
    );
    expect(stored.map((version) => version.number)).toEqual([2, 1]);
    expect(stored[1]?.text).toBe('First version text');
  });

  it('gives concurrent saves distinct numbers', async () => {
    const workspaceId = ids.generate();
    const promptId = await seedPromptForVersion(workspaceId);
    const ctx = promptsCtx(testingModule, workspaceId);
    const id = publicPromptId(testingModule, promptId);

    await Promise.all([
      saveVersion.execute(ctx, { id, text: 'First version text' }),
      saveVersion.execute(ctx, { id, text: 'Second version text' }),
    ]);

    const stored = await tenants.run(workspaceId, () =>
      versions.listByPrompt(workspaceId, promptId),
    );
    expect(stored.map((version) => version.number)).toEqual([2, 1]);
  });

  it('refuses an unknown prompt', async () => {
    const attempt = saveVersion.execute(promptsCtx(testingModule, ids.generate()), {
      id: publicPromptId(testingModule, ids.generate()),
      text: TEST_PROMPT_TEXT,
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
  });

  it.each([
    ['text', { text: '' }],
    ['text', { text: '   ' }],
    ['text', { text: 'x'.repeat(MAX_TEMPLATE_LENGTH + 1) }],
    ['note', { text: TEST_PROMPT_TEXT, note: 'x'.repeat(PROMPT_VERSION_NOTE_MAX_LENGTH + 1) }],
  ])('rejects an invalid %s', async (path, input) => {
    const attempt = saveVersion.execute(promptsCtx(testingModule, ids.generate()), {
      id: publicPromptId(testingModule, ids.generate()),
      ...input,
    });

    await expect(attempt).rejects.toMatchObject({
      fields: [{ path, reason: ErrorReason.InvalidRequest }],
    });
  });
});
