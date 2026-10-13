import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptFolderNotFoundError } from '@/modules/prompts/errors/prompt-folder-not-found.error';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { MovePromptToFolderUseCase } from '@/modules/prompts/use-cases/move-prompt-to-folder.use-case';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  PROMPTS_TEST_LATER,
  PROMPTS_TEST_START,
  TEST_FOLDER_NEW_NAME,
  TEST_PROMPT_NAME,
} from '@test/support/constants/prompts-testing.constants';
import {
  createPromptsTestingModule,
  promptsCtx,
  publicPromptFolderId,
  publicPromptId,
  seedPrompt,
  seedPromptFolder,
} from '@test/support/helpers/prompts-testing.helpers';

describe('MovePromptToFolderUseCase', () => {
  let testingModule: TestingModule;
  let movePrompt: MovePromptToFolderUseCase;
  let folders: PromptFoldersRepository;
  let prompts: PromptsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    movePrompt = testingModule.get(MovePromptToFolderUseCase);
    folders = testingModule.get(PromptFoldersRepository);
    prompts = testingModule.get(PromptsRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('moves a prompt to another folder and returns the new folder', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const otherFolderId = await seedPromptFolder(testingModule, workspaceId, {
      name: TEST_FOLDER_NEW_NAME,
    });
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);

    const view = await movePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(testingModule, promptId),
      folderId: publicPromptFolderId(testingModule, otherFolderId),
    });

    const stored = await tenants.run(workspaceId, () => prompts.findById(workspaceId, promptId));
    expect(view).toMatchObject({
      id: publicPromptId(testingModule, promptId),
      name: TEST_PROMPT_NAME,
      folderId: publicPromptFolderId(testingModule, otherFolderId),
    });
    expect(stored?.folderId).toBe(otherFolderId);
    expect(stored?.updatedAt.getTime()).toBeGreaterThan(PROMPTS_TEST_START.getTime());
  });

  it('keeps the prompt in place when it is already in the folder', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);

    const view = await movePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(testingModule, promptId),
      folderId: publicPromptFolderId(testingModule, folderId),
    });

    const stored = await tenants.run(workspaceId, () => prompts.findById(workspaceId, promptId));
    expect(view.folderId).toBe(publicPromptFolderId(testingModule, folderId));
    expect(stored?.updatedAt).toEqual(PROMPTS_TEST_START);
  });

  it('refuses an unknown prompt', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);

    const attempt = movePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(testingModule, ids.generate()),
      folderId: publicPromptFolderId(testingModule, folderId),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
  });

  it('refuses an unknown folder', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);

    const attempt = movePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(testingModule, promptId),
      folderId: publicPromptFolderId(testingModule, ids.generate()),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
  });

  it('refuses a deleted folder', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const otherFolderId = await seedPromptFolder(testingModule, workspaceId, {
      name: TEST_FOLDER_NEW_NAME,
    });
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);
    await tenants.run(workspaceId, () =>
      folders.softDelete(workspaceId, otherFolderId, PROMPTS_TEST_LATER),
    );

    const attempt = movePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(testingModule, promptId),
      folderId: publicPromptFolderId(testingModule, otherFolderId),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
  });
});
