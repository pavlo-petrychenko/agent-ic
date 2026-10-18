import { WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptInUseError } from '@/modules/prompts/errors/prompt-in-use.error';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { DeletePromptUseCase } from '@/modules/prompts/use-cases/delete-prompt.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  TEST_PROMPT_NAME,
  TEST_PROMPT_NEW_NAME,
} from '@test/support/constants/prompts-testing.constants';
import {
  TEST_STEP_NODE_ID,
  TEST_STEP_NODE_KEY,
} from '@test/support/constants/runs-testing.constants';
import {
  agentWithLibraryPrompt,
  libraryPromptFlow,
} from '@test/support/fixtures/prompt-flow.fixture';
import { seedAgentWithDraft } from '@test/support/helpers/agents-testing.helpers';
import {
  createPromptsTestingModule,
  promptsCtx,
  publicPromptId,
  seedPrompt,
  seedPromptFolder,
  seedPromptVersion,
} from '@test/support/helpers/prompts-testing.helpers';

describe('DeletePromptUseCase', () => {
  let testingModule: TestingModule;
  let deletePrompt: DeletePromptUseCase;
  let prompts: PromptsRepository;
  let versions: PromptVersionsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    deletePrompt = testingModule.get(DeletePromptUseCase);
    prompts = testingModule.get(PromptsRepository);
    versions = testingModule.get(PromptVersionsRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('deletes the prompt and its versions and returns the id', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);
    const otherPromptId = await seedPrompt(testingModule, workspaceId, folderId, {
      name: TEST_PROMPT_NEW_NAME,
    });
    await seedPromptVersion(testingModule, workspaceId, promptId);

    const result = await deletePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(testingModule, promptId),
    });

    const stored = await tenants.run(workspaceId, async () => ({
      found: await prompts.findById(workspaceId, promptId),
      byName: await prompts.findByName(workspaceId, TEST_PROMPT_NAME),
      versions: await versions.listByPrompt(workspaceId, promptId),
      listed: await prompts.list(workspaceId),
      other: await prompts.findById(workspaceId, otherPromptId),
    }));
    expect(result).toEqual({ id: publicPromptId(testingModule, promptId) });
    expect(stored.found).toBeNull();
    expect(stored.byName).toBeNull();
    expect(stored.versions).toEqual([]);
    expect(stored.listed.map((prompt) => prompt.id)).toEqual([otherPromptId]);
    expect(stored.other).not.toBeNull();
  });

  it('refuses to delete a prompt that a step uses and keeps it', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);
    const promptRef = publicPromptId(testingModule, promptId);
    await seedAgentWithDraft(
      testingModule,
      workspaceId,
      libraryPromptFlow([agentWithLibraryPrompt(TEST_STEP_NODE_ID, TEST_STEP_NODE_KEY, promptRef)]),
    );

    const attempt = deletePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: promptRef,
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptInUseError);
    const stored = await tenants.run(workspaceId, () => prompts.findById(workspaceId, promptId));
    expect(stored).not.toBeNull();
  });

  it('refuses an unknown prompt', async () => {
    const attempt = deletePrompt.execute(promptsCtx(testingModule, ids.generate()), {
      id: publicPromptId(testingModule, ids.generate()),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);

    const attempt = deletePrompt.execute(
      promptsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { id: publicPromptId(testingModule, promptId) },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
