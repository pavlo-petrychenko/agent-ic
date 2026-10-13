import { ErrorReason, IdPrefix, PROMPT_NAME_MAX_LENGTH, WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptNameTakenError } from '@/modules/prompts/errors/prompt-name-taken.error';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { RenamePromptUseCase } from '@/modules/prompts/use-cases/rename-prompt.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { InvalidIdError } from '@/platform/ids/errors/invalid-id.error';
import { IdService } from '@/platform/ids/services/id.service';
import {
  PROMPTS_TEST_LATER,
  TEST_FOLDER_NAME,
  TEST_PROMPT_NAME,
  TEST_PROMPT_NEW_NAME,
} from '@test/support/constants/prompts-testing.constants';
import { newFolder, newPrompt } from '@test/support/fixtures/prompts.fixture';
import {
  createPromptsTestingModule,
  promptsCtx,
} from '@test/support/helpers/prompts-testing.helpers';

const PADDED_NAME = `  ${TEST_PROMPT_NEW_NAME}  `;

describe('RenamePromptUseCase', () => {
  let testingModule: TestingModule;
  let renamePrompt: RenamePromptUseCase;
  let folders: PromptFoldersRepository;
  let prompts: PromptsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    renamePrompt = testingModule.get(RenamePromptUseCase);
    folders = testingModule.get(PromptFoldersRepository);
    prompts = testingModule.get(PromptsRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const seedFolder = async (workspaceId: string): Promise<string> => {
    const folderId = ids.generate();
    await tenants.run(workspaceId, () =>
      folders.insert(newFolder(folderId, workspaceId, { name: TEST_FOLDER_NAME })),
    );
    return folderId;
  };

  const seedPrompt = async (
    workspaceId: string,
    folderId: string,
    name: string = TEST_PROMPT_NAME,
  ): Promise<string> => {
    const promptId = ids.generate();
    await tenants.run(workspaceId, () =>
      prompts.insert(newPrompt(promptId, workspaceId, folderId, { name })),
    );
    return promptId;
  };

  const publicPromptId = (promptId: string): string => ids.toPublic(IdPrefix.Prompt, promptId);

  it('renames a prompt and returns the new name', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId);

    const view = await renamePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
      name: PADDED_NAME,
    });

    const stored = await tenants.run(workspaceId, () => prompts.findById(workspaceId, promptId));
    expect(view).toMatchObject({ id: publicPromptId(promptId), name: TEST_PROMPT_NEW_NAME });
    expect(stored?.name).toBe(TEST_PROMPT_NEW_NAME);
  });

  it('allows keeping the same name', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId);

    const view = await renamePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
      name: TEST_PROMPT_NAME.toUpperCase(),
    });

    expect(view.name).toBe(TEST_PROMPT_NAME.toUpperCase());
  });

  it('refuses a name taken by another prompt, ignoring case', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    await seedPrompt(workspaceId, folderId);
    const promptId = await seedPrompt(workspaceId, folderId, TEST_PROMPT_NEW_NAME);

    const attempt = renamePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
      name: TEST_PROMPT_NAME.toUpperCase(),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNameTakenError);
  });

  it('allows a name freed by a deleted prompt', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const deletedPromptId = await seedPrompt(workspaceId, folderId);
    const promptId = await seedPrompt(workspaceId, folderId, TEST_PROMPT_NEW_NAME);
    await tenants.run(workspaceId, () =>
      prompts.softDelete(workspaceId, deletedPromptId, PROMPTS_TEST_LATER),
    );

    const view = await renamePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
      name: TEST_PROMPT_NAME,
    });

    expect(view.name).toBe(TEST_PROMPT_NAME);
  });

  it('refuses an unknown prompt', async () => {
    const attempt = renamePrompt.execute(promptsCtx(testingModule, ids.generate()), {
      id: publicPromptId(ids.generate()),
      name: TEST_PROMPT_NEW_NAME,
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
  });

  it('never renames the prompt of another workspace', async () => {
    const workspaceA = ids.generate();
    const workspaceB = ids.generate();
    const folderId = await seedFolder(workspaceA);
    const promptId = await seedPrompt(workspaceA, folderId);

    const attempt = renamePrompt.execute(promptsCtx(testingModule, workspaceB), {
      id: publicPromptId(promptId),
      name: TEST_PROMPT_NEW_NAME,
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
    const stored = await tenants.run(workspaceA, () => prompts.findById(workspaceA, promptId));
    expect(stored?.name).toBe(TEST_PROMPT_NAME);
  });

  it.each([
    ['', ErrorReason.InvalidRequest],
    ['   ', ErrorReason.InvalidRequest],
    ['x'.repeat(PROMPT_NAME_MAX_LENGTH + 1), ErrorReason.InvalidRequest],
  ])('rejects the name %j', async (name, reason) => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId);

    const attempt = renamePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
      name,
    });

    await expect(attempt).rejects.toMatchObject({
      fields: [{ path: 'name', reason }],
    });
  });

  it('rejects an empty id', async () => {
    const attempt = renamePrompt.execute(promptsCtx(testingModule, ids.generate()), {
      id: '',
      name: TEST_PROMPT_NEW_NAME,
    });

    await expect(attempt).rejects.toMatchObject({
      fields: [{ path: 'id', reason: ErrorReason.InvalidId }],
    });
  });

  it('rejects a malformed id', async () => {
    const attempt = renamePrompt.execute(promptsCtx(testingModule, ids.generate()), {
      id: 'nope',
      name: TEST_PROMPT_NEW_NAME,
    });

    await expect(attempt).rejects.toBeInstanceOf(InvalidIdError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId);

    const attempt = renamePrompt.execute(
      promptsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { id: publicPromptId(promptId), name: TEST_PROMPT_NEW_NAME },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
