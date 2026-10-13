import { ErrorReason, IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { DeletePromptUseCase } from '@/modules/prompts/use-cases/delete-prompt.use-case';
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
import { newFolder, newPrompt, newPromptVersion } from '@test/support/fixtures/prompts.fixture';
import {
  createPromptsTestingModule,
  promptsCtx,
} from '@test/support/helpers/prompts-testing.helpers';

describe('DeletePromptUseCase', () => {
  let testingModule: TestingModule;
  let deletePrompt: DeletePromptUseCase;
  let folders: PromptFoldersRepository;
  let prompts: PromptsRepository;
  let versions: PromptVersionsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    deletePrompt = testingModule.get(DeletePromptUseCase);
    folders = testingModule.get(PromptFoldersRepository);
    prompts = testingModule.get(PromptsRepository);
    versions = testingModule.get(PromptVersionsRepository);
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

  const seedVersion = async (workspaceId: string, promptId: string): Promise<void> => {
    const versionId = ids.generate();
    await tenants.run(workspaceId, () =>
      versions.insert(newPromptVersion(versionId, workspaceId, promptId)),
    );
  };

  const publicPromptId = (promptId: string): string => ids.toPublic(IdPrefix.Prompt, promptId);

  it('deletes the prompt and its versions and returns the id', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId);
    const otherPromptId = await seedPrompt(workspaceId, folderId, TEST_PROMPT_NEW_NAME);
    await seedVersion(workspaceId, promptId);

    const result = await deletePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
    });

    const stored = await tenants.run(workspaceId, async () => ({
      found: await prompts.findById(workspaceId, promptId),
      byName: await prompts.findByName(workspaceId, TEST_PROMPT_NAME),
      versions: await versions.listByPrompt(workspaceId, promptId),
      listed: await prompts.list(workspaceId),
      other: await prompts.findById(workspaceId, otherPromptId),
    }));
    expect(result).toEqual({ id: publicPromptId(promptId) });
    expect(stored.found).toBeNull();
    expect(stored.byName).toBeNull();
    expect(stored.versions).toEqual([]);
    expect(stored.listed.map((prompt) => prompt.id)).toEqual([otherPromptId]);
    expect(stored.other).not.toBeNull();
  });

  it('refuses an unknown prompt', async () => {
    const attempt = deletePrompt.execute(promptsCtx(testingModule, ids.generate()), {
      id: publicPromptId(ids.generate()),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
  });

  it('refuses a deleted prompt', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId);
    await tenants.run(workspaceId, () =>
      prompts.softDelete(workspaceId, promptId, PROMPTS_TEST_LATER),
    );

    const attempt = deletePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
  });

  it('never deletes the prompt of another workspace', async () => {
    const workspaceA = ids.generate();
    const workspaceB = ids.generate();
    const folderId = await seedFolder(workspaceA);
    const promptId = await seedPrompt(workspaceA, folderId);

    const attempt = deletePrompt.execute(promptsCtx(testingModule, workspaceB), {
      id: publicPromptId(promptId),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
    const stored = await tenants.run(workspaceA, () => prompts.findById(workspaceA, promptId));
    expect(stored).not.toBeNull();
  });

  it('rejects an empty id', async () => {
    const attempt = deletePrompt.execute(promptsCtx(testingModule, ids.generate()), {
      id: '',
    });

    await expect(attempt).rejects.toMatchObject({
      fields: [{ path: 'id', reason: ErrorReason.InvalidId }],
    });
  });

  it('rejects a malformed id', async () => {
    const attempt = deletePrompt.execute(promptsCtx(testingModule, ids.generate()), {
      id: 'nope',
    });

    await expect(attempt).rejects.toBeInstanceOf(InvalidIdError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId);

    const attempt = deletePrompt.execute(
      promptsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { id: publicPromptId(promptId) },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
