import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { ListPromptsUseCase } from '@/modules/prompts/use-cases/list-prompts.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { InvalidIdError } from '@/platform/ids/errors/invalid-id.error';
import { IdService } from '@/platform/ids/services/id.service';
import {
  PROMPTS_TEST_LATER,
  TEST_FOLDER_NAME,
  TEST_FOLDER_NEW_NAME,
  TEST_PROMPT_NAME,
  TEST_PROMPT_NEW_NAME,
} from '@test/support/constants/prompts-testing.constants';
import { newFolder, newPrompt } from '@test/support/fixtures/prompts.fixture';
import {
  createPromptsTestingModule,
  promptsCtx,
} from '@test/support/helpers/prompts-testing.helpers';

describe('ListPromptsUseCase', () => {
  let testingModule: TestingModule;
  let listPrompts: ListPromptsUseCase;
  let folders: PromptFoldersRepository;
  let prompts: PromptsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    listPrompts = testingModule.get(ListPromptsUseCase);
    folders = testingModule.get(PromptFoldersRepository);
    prompts = testingModule.get(PromptsRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const seedFolder = async (
    workspaceId: string,
    name: string = TEST_FOLDER_NAME,
  ): Promise<string> => {
    const folderId = ids.generate();
    await tenants.run(workspaceId, () =>
      folders.insert(newFolder(folderId, workspaceId, { name })),
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

  const publicFolderId = (folderId: string): string =>
    ids.toPublic(IdPrefix.PromptFolder, folderId);

  it('lists every prompt of the workspace in creation order with public ids', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const alpha = await seedPrompt(workspaceId, folderId, 'Alpha');
    const bravo = await seedPrompt(workspaceId, folderId, 'Bravo');

    const listed = await listPrompts.execute(promptsCtx(testingModule, workspaceId), {});

    expect(listed.map((prompt) => prompt.id)).toEqual([
      publicPromptId(alpha),
      publicPromptId(bravo),
    ]);
    expect(listed.map((prompt) => prompt.name)).toEqual(['Alpha', 'Bravo']);
    expect(listed.map((prompt) => prompt.folderId)).toEqual([
      publicFolderId(folderId),
      publicFolderId(folderId),
    ]);
  });

  it('filters by folder', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const otherFolderId = await seedFolder(workspaceId, TEST_FOLDER_NEW_NAME);
    const inFolder = await seedPrompt(workspaceId, folderId);
    await seedPrompt(workspaceId, otherFolderId, TEST_PROMPT_NEW_NAME);

    const listed = await listPrompts.execute(promptsCtx(testingModule, workspaceId), {
      folderId: publicFolderId(folderId),
    });

    expect(listed.map((prompt) => prompt.id)).toEqual([publicPromptId(inFolder)]);
  });

  it('searches by name across folders, ignoring case', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const otherFolderId = await seedFolder(workspaceId, TEST_FOLDER_NEW_NAME);
    const receptionist = await seedPrompt(workspaceId, otherFolderId, TEST_PROMPT_NAME);
    await seedPrompt(workspaceId, folderId, TEST_PROMPT_NEW_NAME);

    const listed = await listPrompts.execute(promptsCtx(testingModule, workspaceId), {
      search: 'rEcEpTiOn',
    });

    expect(listed.map((prompt) => prompt.id)).toEqual([publicPromptId(receptionist)]);
  });

  it('combines the folder and the search filter', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const otherFolderId = await seedFolder(workspaceId, TEST_FOLDER_NEW_NAME);
    const target = await seedPrompt(workspaceId, folderId, TEST_PROMPT_NAME);
    await seedPrompt(workspaceId, folderId, TEST_PROMPT_NEW_NAME);
    await seedPrompt(workspaceId, otherFolderId, 'Reception answers');

    const listed = await listPrompts.execute(promptsCtx(testingModule, workspaceId), {
      folderId: publicFolderId(folderId),
      search: 'reception',
    });

    expect(listed.map((prompt) => prompt.id)).toEqual([publicPromptId(target)]);
  });

  it('hides a soft-deleted prompt', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId);
    await tenants.run(workspaceId, () =>
      prompts.softDelete(workspaceId, promptId, PROMPTS_TEST_LATER),
    );

    const listed = await listPrompts.execute(promptsCtx(testingModule, workspaceId), {});

    expect(listed).toEqual([]);
  });

  it('never returns the prompts of another workspace', async () => {
    const workspaceA = ids.generate();
    const folderId = await seedFolder(workspaceA);
    await seedPrompt(workspaceA, folderId);

    const listed = await listPrompts.execute(promptsCtx(testingModule, ids.generate()), {});

    expect(listed).toEqual([]);
  });

  it('returns an empty list for a folder of another workspace', async () => {
    const workspaceA = ids.generate();
    const folderId = await seedFolder(workspaceA);
    await seedPrompt(workspaceA, folderId);

    const listed = await listPrompts.execute(promptsCtx(testingModule, ids.generate()), {
      folderId: publicFolderId(folderId),
    });

    expect(listed).toEqual([]);
  });

  it('rejects a malformed folder id', async () => {
    const attempt = listPrompts.execute(promptsCtx(testingModule, ids.generate()), {
      folderId: 'nope',
    });

    await expect(attempt).rejects.toBeInstanceOf(InvalidIdError);
  });

  it('refuses an operator', async () => {
    const attempt = listPrompts.execute(
      promptsCtx(testingModule, ids.generate(), WorkspaceRole.Operator),
      {},
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
