import { MAX_TEMPLATE_LENGTH } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NO_PROMPT_VERSIONS } from '@/modules/prompts/constants/prompt.constants';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import type { NewPromptVersion } from '@/modules/prompts/typedefs/prompt-version.typedefs';
import type { NewPrompt } from '@/modules/prompts/typedefs/prompt.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { CLOCK_TICK_MS } from '@test/support/constants/manual-clock.constants';
import {
  CHECK_VIOLATION,
  FOREIGN_KEY_VIOLATION,
  ROW_LEVEL_SECURITY_VIOLATION,
  UNIQUE_VIOLATION,
} from '@test/support/constants/postgres-errors.constants';
import {
  PROMPTS_TEST_LATER,
  TEST_PROMPT_NEW_NAME,
  TEST_PROMPT_NOTE,
  TEST_PROMPT_TEXT,
} from '@test/support/constants/prompts-testing.constants';
import type { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { newFolder, newPrompt, newPromptVersion } from '@test/support/fixtures/prompts.fixture';
import { manualClockOf } from '@test/support/helpers/manual-clock.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import { createPromptsTestingModule } from '@test/support/helpers/prompts-testing.helpers';

const FIRST_NUMBER = 1;
const SECOND_NUMBER = 2;
const THIRD_NUMBER = 3;
const SKIPPED_NUMBER = 5;

describe('PromptVersionsRepository', () => {
  let testingModule: TestingModule;
  let folders: PromptFoldersRepository;
  let prompts: PromptsRepository;
  let repository: PromptVersionsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;
  let clock: ManualClock;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    folders = testingModule.get(PromptFoldersRepository);
    prompts = testingModule.get(PromptsRepository);
    repository = testingModule.get(PromptVersionsRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
    clock = manualClockOf(testingModule);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const insertPrompt = async (
    workspaceId: string,
    overrides: Partial<NewPrompt> = {},
  ): Promise<string> => {
    const promptId = ids.generate();
    const folderId = ids.generate();
    await ensureWorkspaceRow(testingModule, workspaceId);
    await tenants.run(workspaceId, async () => {
      await folders.insert(newFolder(folderId, workspaceId, { name: `Folder ${promptId}` }));
      await prompts.insert(newPrompt(promptId, workspaceId, folderId, overrides));
    });
    return promptId;
  };

  const insertVersion = async (
    workspaceId: string,
    promptId: string,
    overrides: Partial<NewPromptVersion> = {},
  ): Promise<string> => {
    const versionId = ids.generate();
    await tenants.run(workspaceId, () =>
      repository.insert(newPromptVersion(versionId, workspaceId, promptId, overrides)),
    );
    return versionId;
  };

  it('stores a version and finds it by id', async () => {
    const workspaceId = ids.generate();
    const promptId = await insertPrompt(workspaceId);
    clock.advanceBy(CLOCK_TICK_MS);
    const versionId = await insertVersion(workspaceId, promptId);

    const found = await tenants.run(workspaceId, () => repository.findById(workspaceId, versionId));

    expect(found).toMatchObject({
      id: versionId,
      workspaceId,
      promptId,
      number: FIRST_NUMBER,
      text: TEST_PROMPT_TEXT,
      note: TEST_PROMPT_NOTE,
      authorId: null,
      createdAt: clock.now(),
      deletedAt: null,
    });
  });

  it('lists versions newest number first', async () => {
    const workspaceId = ids.generate();
    const promptId = await insertPrompt(workspaceId);
    await insertVersion(workspaceId, promptId, { number: FIRST_NUMBER });
    await insertVersion(workspaceId, promptId, { number: SECOND_NUMBER });
    await insertVersion(workspaceId, promptId, { number: THIRD_NUMBER });

    const listed = await tenants.run(workspaceId, () =>
      repository.listByPrompt(workspaceId, promptId),
    );

    expect(listed.map((version) => version.number)).toEqual([
      THIRD_NUMBER,
      SECOND_NUMBER,
      FIRST_NUMBER,
    ]);
  });

  it('reports the last number, zero when there are none', async () => {
    const workspaceId = ids.generate();
    const promptId = await insertPrompt(workspaceId);

    const empty = await tenants.run(workspaceId, () =>
      repository.lastNumber(workspaceId, promptId),
    );
    await insertVersion(workspaceId, promptId, { number: FIRST_NUMBER });
    await insertVersion(workspaceId, promptId, { number: SKIPPED_NUMBER });
    const last = await tenants.run(workspaceId, () => repository.lastNumber(workspaceId, promptId));

    expect(empty).toBe(NO_PROMPT_VERSIONS);
    expect(last).toBe(SKIPPED_NUMBER);
  });

  it('finds the latest version', async () => {
    const workspaceId = ids.generate();
    const promptId = await insertPrompt(workspaceId);
    await insertVersion(workspaceId, promptId, { number: FIRST_NUMBER });
    const latestId = await insertVersion(workspaceId, promptId, { number: SECOND_NUMBER });

    const found = await tenants.run(workspaceId, () =>
      repository.findLatest(workspaceId, promptId),
    );

    expect(found?.id).toBe(latestId);
  });

  it('finds a version by its number, null when it is missing', async () => {
    const workspaceId = ids.generate();
    const promptId = await insertPrompt(workspaceId);
    await insertVersion(workspaceId, promptId, { number: FIRST_NUMBER });
    const secondId = await insertVersion(workspaceId, promptId, { number: SECOND_NUMBER });

    const found = await tenants.run(workspaceId, () =>
      repository.findByNumber(workspaceId, promptId, SECOND_NUMBER),
    );
    const missing = await tenants.run(workspaceId, () =>
      repository.findByNumber(workspaceId, promptId, SKIPPED_NUMBER),
    );

    expect(found?.id).toBe(secondId);
    expect(missing).toBeNull();
  });

  it('soft deletes every version of one prompt only', async () => {
    const workspaceId = ids.generate();
    const promptA = await insertPrompt(workspaceId);
    const promptB = await insertPrompt(workspaceId, { name: TEST_PROMPT_NEW_NAME });
    const versionA1 = await insertVersion(workspaceId, promptA, { number: FIRST_NUMBER });
    await insertVersion(workspaceId, promptA, { number: SECOND_NUMBER });
    const versionB1 = await insertVersion(workspaceId, promptB, { number: FIRST_NUMBER });

    const deleted = await tenants.run(workspaceId, () =>
      repository.softDeleteByPrompt(workspaceId, promptA, PROMPTS_TEST_LATER),
    );
    const deletedAgain = await tenants.run(workspaceId, () =>
      repository.softDeleteByPrompt(workspaceId, promptA, PROMPTS_TEST_LATER),
    );
    const results = await tenants.run(workspaceId, async () => ({
      found: await repository.findById(workspaceId, versionA1),
      byNumber: await repository.findByNumber(workspaceId, promptA, FIRST_NUMBER),
      listA: await repository.listByPrompt(workspaceId, promptA),
      lastA: await repository.lastNumber(workspaceId, promptA),
      listB: await repository.listByPrompt(workspaceId, promptB),
    }));

    expect({ deleted, deletedAgain }).toEqual({ deleted: 2, deletedAgain: 0 });
    expect(results.found).toBeNull();
    expect(results.byNumber).toBeNull();
    expect(results.listA).toEqual([]);
    expect(results.lastA).toBe(SECOND_NUMBER);
    expect(results.listB.map((version) => version.id)).toEqual([versionB1]);
  });

  describe('constraints', () => {
    it('allows a number once per prompt', async () => {
      const workspaceId = ids.generate();
      const promptId = await insertPrompt(workspaceId);
      await insertVersion(workspaceId, promptId, { number: FIRST_NUMBER });

      const again = insertVersion(workspaceId, promptId, { number: FIRST_NUMBER });

      await expect(again).rejects.toMatchObject(UNIQUE_VIOLATION);
    });

    it('refuses a number below one', async () => {
      const workspaceId = ids.generate();
      const promptId = await insertPrompt(workspaceId);

      const write = insertVersion(workspaceId, promptId, { number: 0 });

      await expect(write).rejects.toMatchObject(CHECK_VIOLATION);
    });

    it('refuses text longer than the template limit', async () => {
      const workspaceId = ids.generate();
      const promptId = await insertPrompt(workspaceId);

      const write = insertVersion(workspaceId, promptId, {
        text: 'x'.repeat(MAX_TEMPLATE_LENGTH + 1),
      });

      await expect(write).rejects.toMatchObject(CHECK_VIOLATION);
    });

    it('refuses a prompt of another workspace', async () => {
      const workspaceA = ids.generate();
      const workspaceB = ids.generate();
      const promptId = await insertPrompt(workspaceB);

      const write = insertVersion(workspaceA, promptId);

      await expect(write).rejects.toMatchObject(FOREIGN_KEY_VIOLATION);
    });
  });

  describe('across tenants', () => {
    it('never shows, numbers or soft deletes the versions of another workspace', async () => {
      const workspaceA = ids.generate();
      const workspaceB = ids.generate();
      const promptId = await insertPrompt(workspaceA);
      const versionId = await insertVersion(workspaceA, promptId, { number: FIRST_NUMBER });

      const fromB = await tenants.run(workspaceB, async () => ({
        found: await repository.findById(workspaceA, versionId),
        byNumber: await repository.findByNumber(workspaceA, promptId, FIRST_NUMBER),
        list: await repository.listByPrompt(workspaceA, promptId),
        last: await repository.lastNumber(workspaceA, promptId),
        latest: await repository.findLatest(workspaceA, promptId),
        deleted: await repository.softDeleteByPrompt(workspaceA, promptId, PROMPTS_TEST_LATER),
      }));
      const ownFromA = await tenants.run(workspaceA, () =>
        repository.findById(workspaceA, versionId),
      );

      expect(fromB).toEqual({
        found: null,
        byNumber: null,
        list: [],
        last: NO_PROMPT_VERSIONS,
        latest: null,
        deleted: 0,
      });
      expect(ownFromA?.id).toBe(versionId);
    });

    it('shows nothing without a tenant', async () => {
      const workspaceId = ids.generate();
      const promptId = await insertPrompt(workspaceId);
      const versionId = await insertVersion(workspaceId, promptId);

      expect(await repository.findById(workspaceId, versionId)).toBeNull();
      expect(await repository.lastNumber(workspaceId, promptId)).toBe(NO_PROMPT_VERSIONS);
    });

    it('refuses to write a version into another workspace', async () => {
      const workspaceA = ids.generate();
      const workspaceB = ids.generate();
      const promptId = await insertPrompt(workspaceB);

      const write = tenants.run(workspaceA, () =>
        repository.insert(newPromptVersion(ids.generate(), workspaceB, promptId)),
      );

      await expect(write).rejects.toMatchObject(ROW_LEVEL_SECURITY_VIOLATION);
    });
  });
});
