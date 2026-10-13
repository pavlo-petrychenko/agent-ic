import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptNameTakenError } from '@/modules/prompts/errors/prompt-name-taken.error';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { RenamePromptUseCase } from '@/modules/prompts/use-cases/rename-prompt.use-case';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  PROMPTS_TEST_LATER,
  TEST_PROMPT_NAME,
  TEST_PROMPT_NEW_NAME,
} from '@test/support/constants/prompts-testing.constants';
import {
  createPromptsTestingModule,
  promptsCtx,
  publicPromptId,
  seedPrompt,
  seedPromptFolder,
} from '@test/support/helpers/prompts-testing.helpers';

const PADDED_NAME = `  ${TEST_PROMPT_NEW_NAME}  `;

describe('RenamePromptUseCase', () => {
  let testingModule: TestingModule;
  let renamePrompt: RenamePromptUseCase;
  let prompts: PromptsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    renamePrompt = testingModule.get(RenamePromptUseCase);
    prompts = testingModule.get(PromptsRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('renames a prompt and returns the new name', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);

    const view = await renamePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(testingModule, promptId),
      name: PADDED_NAME,
    });

    const stored = await tenants.run(workspaceId, () => prompts.findById(workspaceId, promptId));
    expect(view).toMatchObject({
      id: publicPromptId(testingModule, promptId),
      name: TEST_PROMPT_NEW_NAME,
    });
    expect(stored?.name).toBe(TEST_PROMPT_NEW_NAME);
  });

  it('allows keeping the same name', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);

    const view = await renamePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(testingModule, promptId),
      name: TEST_PROMPT_NAME.toUpperCase(),
    });

    expect(view.name).toBe(TEST_PROMPT_NAME.toUpperCase());
  });

  it('refuses a name taken by another prompt, ignoring case', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    await seedPrompt(testingModule, workspaceId, folderId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId, {
      name: TEST_PROMPT_NEW_NAME,
    });

    const attempt = renamePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(testingModule, promptId),
      name: TEST_PROMPT_NAME.toUpperCase(),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNameTakenError);
  });

  it('allows a name freed by a deleted prompt', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const deletedPromptId = await seedPrompt(testingModule, workspaceId, folderId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId, {
      name: TEST_PROMPT_NEW_NAME,
    });
    await tenants.run(workspaceId, () =>
      prompts.softDelete(workspaceId, deletedPromptId, PROMPTS_TEST_LATER),
    );

    const view = await renamePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(testingModule, promptId),
      name: TEST_PROMPT_NAME,
    });

    expect(view.name).toBe(TEST_PROMPT_NAME);
  });

  it('refuses an unknown prompt', async () => {
    const attempt = renamePrompt.execute(promptsCtx(testingModule, ids.generate()), {
      id: publicPromptId(testingModule, ids.generate()),
      name: TEST_PROMPT_NEW_NAME,
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
  });
});
