import { ErrorReason, IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptFolderNotFoundError } from '@/modules/prompts/errors/prompt-folder-not-found.error';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { MovePromptToFolderUseCase } from '@/modules/prompts/use-cases/move-prompt-to-folder.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { InvalidIdError } from '@/platform/ids/errors/invalid-id.error';
import { IdService } from '@/platform/ids/services/id.service';
import {
  PROMPTS_TEST_LATER,
  PROMPTS_TEST_START,
  TEST_FOLDER_NAME,
  TEST_FOLDER_NEW_NAME,
  TEST_PROMPT_NAME,
} from '@test/support/constants/prompts-testing.constants';
import { newFolder, newPrompt } from '@test/support/fixtures/prompts.fixture';
import {
  createPromptsTestingModule,
  promptsCtx,
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

  it('moves a prompt to another folder and returns the new folder', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const otherFolderId = await seedFolder(workspaceId, TEST_FOLDER_NEW_NAME);
    const promptId = await seedPrompt(workspaceId, folderId);

    const view = await movePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
      folderId: publicFolderId(otherFolderId),
    });

    const stored = await tenants.run(workspaceId, () => prompts.findById(workspaceId, promptId));
    expect(view).toMatchObject({
      id: publicPromptId(promptId),
      name: TEST_PROMPT_NAME,
      folderId: publicFolderId(otherFolderId),
    });
    expect(view.updatedAt.getTime()).toBeGreaterThan(PROMPTS_TEST_START.getTime());
    expect(stored?.folderId).toBe(otherFolderId);
    expect(stored?.updatedAt).toEqual(view.updatedAt);
  });

  it('keeps the prompt in place when it is already in the folder', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId);

    const view = await movePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
      folderId: publicFolderId(folderId),
    });

    const stored = await tenants.run(workspaceId, () => prompts.findById(workspaceId, promptId));
    expect(view.folderId).toBe(publicFolderId(folderId));
    expect(stored?.updatedAt).toEqual(PROMPTS_TEST_START);
  });

  it('refuses an unknown prompt', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);

    const attempt = movePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(ids.generate()),
      folderId: publicFolderId(folderId),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
  });

  it('refuses a deleted prompt', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const otherFolderId = await seedFolder(workspaceId, TEST_FOLDER_NEW_NAME);
    const promptId = await seedPrompt(workspaceId, folderId);
    await tenants.run(workspaceId, () =>
      prompts.softDelete(workspaceId, promptId, PROMPTS_TEST_LATER),
    );

    const attempt = movePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
      folderId: publicFolderId(otherFolderId),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
  });

  it('refuses an unknown folder', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId);

    const attempt = movePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
      folderId: publicFolderId(ids.generate()),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
  });

  it('refuses a deleted folder', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const otherFolderId = await seedFolder(workspaceId, TEST_FOLDER_NEW_NAME);
    const promptId = await seedPrompt(workspaceId, folderId);
    await tenants.run(workspaceId, () =>
      folders.softDelete(workspaceId, otherFolderId, PROMPTS_TEST_LATER),
    );

    const attempt = movePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
      folderId: publicFolderId(otherFolderId),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
  });

  it('never moves the prompt of another workspace', async () => {
    const workspaceA = ids.generate();
    const workspaceB = ids.generate();
    const folderA = await seedFolder(workspaceA);
    const folderB = await seedFolder(workspaceB);
    const promptId = await seedPrompt(workspaceA, folderA);

    const attempt = movePrompt.execute(promptsCtx(testingModule, workspaceB), {
      id: publicPromptId(promptId),
      folderId: publicFolderId(folderB),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
    const stored = await tenants.run(workspaceA, () => prompts.findById(workspaceA, promptId));
    expect(stored?.folderId).toBe(folderA);
  });

  it('never moves a prompt into the folder of another workspace', async () => {
    const workspaceA = ids.generate();
    const workspaceB = ids.generate();
    const folderA = await seedFolder(workspaceA);
    const folderB = await seedFolder(workspaceB);
    const promptId = await seedPrompt(workspaceB, folderB);

    const attempt = movePrompt.execute(promptsCtx(testingModule, workspaceB), {
      id: publicPromptId(promptId),
      folderId: publicFolderId(folderA),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
    const stored = await tenants.run(workspaceB, () => prompts.findById(workspaceB, promptId));
    expect(stored?.folderId).toBe(folderB);
  });

  it('rejects an empty prompt id and folder id', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId);

    await expect(
      movePrompt.execute(promptsCtx(testingModule, workspaceId), {
        id: '',
        folderId: publicFolderId(folderId),
      }),
    ).rejects.toMatchObject({ fields: [{ path: 'id', reason: ErrorReason.InvalidId }] });
    await expect(
      movePrompt.execute(promptsCtx(testingModule, workspaceId), {
        id: publicPromptId(promptId),
        folderId: '',
      }),
    ).rejects.toMatchObject({ fields: [{ path: 'folderId', reason: ErrorReason.InvalidId }] });
  });

  it('rejects a malformed prompt id', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);

    const attempt = movePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: 'nope',
      folderId: publicFolderId(folderId),
    });

    await expect(attempt).rejects.toBeInstanceOf(InvalidIdError);
  });

  it('rejects a malformed folder id', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId);

    const attempt = movePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
      folderId: 'nope',
    });

    await expect(attempt).rejects.toBeInstanceOf(InvalidIdError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const otherFolderId = await seedFolder(workspaceId, TEST_FOLDER_NEW_NAME);
    const promptId = await seedPrompt(workspaceId, folderId);

    const attempt = movePrompt.execute(
      promptsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { id: publicPromptId(promptId), folderId: publicFolderId(otherFolderId) },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
