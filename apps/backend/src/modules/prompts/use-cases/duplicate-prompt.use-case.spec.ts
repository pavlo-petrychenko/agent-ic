import { IdPrefix, PROMPT_NAME_MAX_LENGTH, WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  DUPLICATE_PROMPT_NAME_SUFFIX,
  FIRST_PROMPT_NAME_NUMBER,
  FIRST_PROMPT_VERSION_NUMBER,
  NUMBERED_PROMPT_NAME_SEPARATOR,
} from '@/modules/prompts/constants/prompt.constants';
import { PromptFolderNotFoundError } from '@/modules/prompts/errors/prompt-folder-not-found.error';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { DuplicatePromptUseCase } from '@/modules/prompts/use-cases/duplicate-prompt.use-case';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_EDITOR_ID } from '@test/support/constants/agents-testing.constants';
import {
  PROMPTS_TEST_LATER,
  TEST_FOLDER_NEW_NAME,
  TEST_PROMPT_NAME,
  TEST_PROMPT_NOTE,
  TEST_PROMPT_TEXT,
} from '@test/support/constants/prompts-testing.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createPromptsTestingModule,
  promptsCtx,
  publicPromptFolderId,
  publicPromptId,
  seedPrompt,
  seedPromptFolder,
  seedPromptVersion,
} from '@test/support/helpers/prompts-testing.helpers';

const COPY_NAME = `${TEST_PROMPT_NAME}${DUPLICATE_PROMPT_NAME_SUFFIX}`;

describe('DuplicatePromptUseCase', () => {
  let testingModule: TestingModule;
  let duplicatePrompt: DuplicatePromptUseCase;
  let prompts: PromptsRepository;
  let versions: PromptVersionsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    duplicatePrompt = testingModule.get(DuplicatePromptUseCase);
    prompts = testingModule.get(PromptsRepository);
    versions = testingModule.get(PromptVersionsRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('duplicates a prompt into the chosen folder and credits the caller', async () => {
    const workspaceId = ids.generate();
    const userId = TEST_EDITOR_ID;
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const targetFolderId = await seedPromptFolder(testingModule, workspaceId, {
      name: TEST_FOLDER_NEW_NAME,
    });
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);

    const view = await duplicatePrompt.execute(
      workspaceCtx(userId, workspaceId, WorkspaceRole.Owner),
      {
        id: publicPromptId(testingModule, promptId),
        folderId: publicPromptFolderId(testingModule, targetFolderId),
      },
    );

    const copyId = ids.fromPublic(IdPrefix.Prompt, view.id);
    const stored = await tenants.run(workspaceId, async () => ({
      copy: await prompts.findById(workspaceId, copyId),
      source: await prompts.findById(workspaceId, promptId),
    }));
    expect(view).toMatchObject({
      name: COPY_NAME,
      folderId: publicPromptFolderId(testingModule, targetFolderId),
    });
    expect(stored.copy).toMatchObject({
      name: COPY_NAME,
      folderId: targetFolderId,
      createdByUserId: userId,
    });
    expect(stored.source?.folderId).toBe(folderId);
    expect(
      await tenants.run(workspaceId, () => versions.listByPrompt(workspaceId, copyId)),
    ).toEqual([]);
  });

  it('copies the latest version as the first version of the copy', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);
    await seedPromptVersion(testingModule, workspaceId, promptId, {
      number: 1,
      text: 'First version text',
      note: 'first',
    });
    await seedPromptVersion(testingModule, workspaceId, promptId, {
      number: 2,
      text: TEST_PROMPT_TEXT,
      note: TEST_PROMPT_NOTE,
    });

    const view = await duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(testingModule, promptId),
      folderId: publicPromptFolderId(testingModule, folderId),
    });

    const copied = await tenants.run(workspaceId, () =>
      versions.listByPrompt(workspaceId, ids.fromPublic(IdPrefix.Prompt, view.id)),
    );
    expect(copied).toHaveLength(1);
    expect(copied[0]).toMatchObject({
      number: FIRST_PROMPT_VERSION_NUMBER,
      text: TEST_PROMPT_TEXT,
      note: TEST_PROMPT_NOTE,
    });
  });

  it('numbers a copy when the (copy) name is already taken', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);
    const input = {
      id: publicPromptId(testingModule, promptId),
      folderId: publicPromptFolderId(testingModule, folderId),
    };

    const first = await duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), input);
    const second = await duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), input);

    expect(first.name).toBe(COPY_NAME);
    expect(second.name).toBe(
      `${COPY_NAME}${NUMBERED_PROMPT_NAME_SEPARATOR}${FIRST_PROMPT_NAME_NUMBER}`,
    );
  });

  it('cuts a long name to the prompt name limit', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId, {
      name: 'x'.repeat(PROMPT_NAME_MAX_LENGTH),
    });

    const view = await duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(testingModule, promptId),
      folderId: publicPromptFolderId(testingModule, folderId),
    });

    expect(view.name).toHaveLength(PROMPT_NAME_MAX_LENGTH);
    expect(view.name.endsWith(DUPLICATE_PROMPT_NAME_SUFFIX)).toBe(true);
  });

  it('reuses the name of a deleted prompt', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const deletedPromptId = await seedPrompt(testingModule, workspaceId, folderId, {
      name: COPY_NAME,
    });
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);
    await tenants.run(workspaceId, () =>
      prompts.softDelete(workspaceId, deletedPromptId, PROMPTS_TEST_LATER),
    );

    const view = await duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(testingModule, promptId),
      folderId: publicPromptFolderId(testingModule, folderId),
    });

    expect(view.name).toBe(COPY_NAME);
  });

  it('refuses an unknown prompt', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);

    const attempt = duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(testingModule, ids.generate()),
      folderId: publicPromptFolderId(testingModule, folderId),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
  });

  it('refuses an unknown folder', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);

    const attempt = duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(testingModule, promptId),
      folderId: publicPromptFolderId(testingModule, ids.generate()),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
  });
});
