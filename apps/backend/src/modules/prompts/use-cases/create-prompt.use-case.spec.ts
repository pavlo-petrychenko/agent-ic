import { ErrorReason, PROMPT_NAME_MAX_LENGTH, WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptFolderNotFoundError } from '@/modules/prompts/errors/prompt-folder-not-found.error';
import { PromptNameTakenError } from '@/modules/prompts/errors/prompt-name-taken.error';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { CreatePromptUseCase } from '@/modules/prompts/use-cases/create-prompt.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { IdService } from '@/platform/ids/services/id.service';
import {
  PROMPTS_TEST_LATER,
  TEST_PROMPT_NAME,
} from '@test/support/constants/prompts-testing.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createPromptsTestingModule,
  promptsCtx,
  publicPromptFolderId,
  seedPrompt,
  seedPromptFolder,
} from '@test/support/helpers/prompts-testing.helpers';

const PADDED_NAME = `  ${TEST_PROMPT_NAME}  `;
const CONCURRENT_CREATES = 3;

describe('CreatePromptUseCase', () => {
  let testingModule: TestingModule;
  let createPrompt: CreatePromptUseCase;
  let prompts: PromptsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    createPrompt = testingModule.get(CreatePromptUseCase);
    prompts = testingModule.get(PromptsRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('creates a prompt in a folder and returns it with public ids', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const userId = ids.generate();
    const ctx = workspaceCtx(userId, workspaceId, WorkspaceRole.Builder);

    const view = await createPrompt.execute(ctx, {
      name: PADDED_NAME,
      folderId: publicPromptFolderId(testingModule, folderId),
    });

    const stored = await tenants.run(workspaceId, () =>
      prompts.findByName(workspaceId, TEST_PROMPT_NAME),
    );
    expect(view).toMatchObject({
      name: TEST_PROMPT_NAME,
      folderId: publicPromptFolderId(testingModule, folderId),
    });
    expect(view.createdAt).toBeInstanceOf(Date);
    expect(stored).toMatchObject({
      name: TEST_PROMPT_NAME,
      folderId,
      createdByUserId: userId,
      deletedAt: null,
    });
  });

  it('refuses a name already used in the workspace, ignoring case', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const ctx = promptsCtx(testingModule, workspaceId);
    await createPrompt.execute(ctx, {
      name: TEST_PROMPT_NAME,
      folderId: publicPromptFolderId(testingModule, folderId),
    });

    const attempt = createPrompt.execute(ctx, {
      name: TEST_PROMPT_NAME.toUpperCase(),
      folderId: publicPromptFolderId(testingModule, folderId),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNameTakenError);
    await expect(attempt).rejects.toMatchObject({
      kind: DomainErrorKind.Conflict,
      reason: ErrorReason.PromptNameTaken,
    });
  });

  it('allows a name freed by a deleted prompt', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const deletedPromptId = await seedPrompt(testingModule, workspaceId, folderId);
    await tenants.run(workspaceId, () =>
      prompts.softDelete(workspaceId, deletedPromptId, PROMPTS_TEST_LATER),
    );

    const view = await createPrompt.execute(promptsCtx(testingModule, workspaceId), {
      name: TEST_PROMPT_NAME,
      folderId: publicPromptFolderId(testingModule, folderId),
    });

    expect(view.name).toBe(TEST_PROMPT_NAME);
  });

  it('lets exactly one of several identical creates win', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const ctx = promptsCtx(testingModule, workspaceId);

    const outcomes = await Promise.all(
      Array.from({ length: CONCURRENT_CREATES }, async () => {
        try {
          await createPrompt.execute(ctx, {
            name: TEST_PROMPT_NAME,
            folderId: publicPromptFolderId(testingModule, folderId),
          });
          return 'created';
        } catch (error) {
          if (error instanceof PromptNameTakenError) {
            return 'refused';
          }
          throw error;
        }
      }),
    );

    expect(outcomes.filter((outcome) => outcome === 'created')).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome === 'refused')).toHaveLength(
      CONCURRENT_CREATES - 1,
    );
  });

  it('refuses a folder that does not exist', async () => {
    const attempt = createPrompt.execute(promptsCtx(testingModule, ids.generate()), {
      name: TEST_PROMPT_NAME,
      folderId: publicPromptFolderId(testingModule, ids.generate()),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
  });

  it.each([
    ['', ErrorReason.InvalidRequest],
    ['   ', ErrorReason.InvalidRequest],
    ['x'.repeat(PROMPT_NAME_MAX_LENGTH + 1), ErrorReason.InvalidRequest],
  ])('rejects the name %j', async (name, reason) => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);

    const attempt = createPrompt.execute(promptsCtx(testingModule, workspaceId), {
      name,
      folderId: publicPromptFolderId(testingModule, folderId),
    });

    await expect(attempt).rejects.toMatchObject({
      fields: [{ path: 'name', reason }],
    });
  });

  it('rejects an empty folder id', async () => {
    const attempt = createPrompt.execute(promptsCtx(testingModule, ids.generate()), {
      name: TEST_PROMPT_NAME,
      folderId: '',
    });

    await expect(attempt).rejects.toMatchObject({
      fields: [{ path: 'folderId', reason: ErrorReason.InvalidId }],
    });
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);

    const attempt = createPrompt.execute(
      promptsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { name: TEST_PROMPT_NAME, folderId: publicPromptFolderId(testingModule, folderId) },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
