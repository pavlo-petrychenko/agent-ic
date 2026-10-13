import { ErrorReason, IdPrefix, PROMPT_NAME_MAX_LENGTH, WorkspaceRole } from '@agent-ic/contracts';
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
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { DuplicatePromptUseCase } from '@/modules/prompts/use-cases/duplicate-prompt.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { InvalidIdError } from '@/platform/ids/errors/invalid-id.error';
import { IdService } from '@/platform/ids/services/id.service';
import {
  PROMPTS_TEST_LATER,
  TEST_FOLDER_NAME,
  TEST_FOLDER_NEW_NAME,
  TEST_PROMPT_NAME,
  TEST_PROMPT_NOTE,
  TEST_PROMPT_TEXT,
} from '@test/support/constants/prompts-testing.constants';
import { newFolder, newPrompt, newPromptVersion } from '@test/support/fixtures/prompts.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createPromptsTestingModule,
  promptsCtx,
} from '@test/support/helpers/prompts-testing.helpers';

const COPY_NAME = `${TEST_PROMPT_NAME}${DUPLICATE_PROMPT_NAME_SUFFIX}`;

describe('DuplicatePromptUseCase', () => {
  let testingModule: TestingModule;
  let duplicatePrompt: DuplicatePromptUseCase;
  let folders: PromptFoldersRepository;
  let prompts: PromptsRepository;
  let versions: PromptVersionsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    duplicatePrompt = testingModule.get(DuplicatePromptUseCase);
    folders = testingModule.get(PromptFoldersRepository);
    prompts = testingModule.get(PromptsRepository);
    versions = testingModule.get(PromptVersionsRepository);
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

  const seedVersion = async (
    workspaceId: string,
    promptId: string,
    number: number,
    overrides: Partial<{ text: string; note: string | null }> = {},
  ): Promise<string> => {
    const versionId = ids.generate();
    await tenants.run(workspaceId, () =>
      versions.insert(newPromptVersion(versionId, workspaceId, promptId, { number, ...overrides })),
    );
    return versionId;
  };

  const publicPromptId = (promptId: string): string => ids.toPublic(IdPrefix.Prompt, promptId);

  const publicFolderId = (folderId: string): string =>
    ids.toPublic(IdPrefix.PromptFolder, folderId);

  const internalPromptId = (publicId: string): string => ids.fromPublic(IdPrefix.Prompt, publicId);

  it('duplicates a prompt into the chosen folder and credits the caller', async () => {
    const workspaceId = ids.generate();
    const userId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const targetFolderId = await seedFolder(workspaceId, TEST_FOLDER_NEW_NAME);
    const promptId = await seedPrompt(workspaceId, folderId);

    const view = await duplicatePrompt.execute(
      workspaceCtx(userId, workspaceId, WorkspaceRole.Owner),
      { id: publicPromptId(promptId), folderId: publicFolderId(targetFolderId) },
    );

    const stored = await tenants.run(workspaceId, async () => ({
      copy: await prompts.findById(workspaceId, internalPromptId(view.id)),
      source: await prompts.findById(workspaceId, promptId),
      listed: await prompts.list(workspaceId),
    }));
    expect(view).toMatchObject({ name: COPY_NAME, folderId: publicFolderId(targetFolderId) });
    expect(view.id).not.toBe(publicPromptId(promptId));
    expect(stored.copy).toMatchObject({
      name: COPY_NAME,
      folderId: targetFolderId,
      createdByUserId: userId,
    });
    expect(stored.source?.folderId).toBe(folderId);
    expect(stored.listed).toHaveLength(2);
    expect(
      await tenants.run(workspaceId, () =>
        versions.listByPrompt(workspaceId, internalPromptId(view.id)),
      ),
    ).toEqual([]);
  });

  it('copies the latest version as the first version of the copy', async () => {
    const workspaceId = ids.generate();
    const userId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const targetFolderId = await seedFolder(workspaceId, TEST_FOLDER_NEW_NAME);
    const promptId = await seedPrompt(workspaceId, folderId);
    await seedVersion(workspaceId, promptId, 1, { text: 'First version text', note: 'first' });
    await seedVersion(workspaceId, promptId, 2, {
      text: TEST_PROMPT_TEXT,
      note: TEST_PROMPT_NOTE,
    });

    const view = await duplicatePrompt.execute(
      workspaceCtx(userId, workspaceId, WorkspaceRole.Owner),
      { id: publicPromptId(promptId), folderId: publicFolderId(targetFolderId) },
    );

    const copied = await tenants.run(workspaceId, () =>
      versions.listByPrompt(workspaceId, internalPromptId(view.id)),
    );
    expect(copied).toHaveLength(1);
    expect(copied[0]).toMatchObject({
      number: FIRST_PROMPT_VERSION_NUMBER,
      text: TEST_PROMPT_TEXT,
      note: TEST_PROMPT_NOTE,
      authorId: userId,
    });
  });

  it('numbers a copy when the (copy) name is already taken', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId);
    const input = { id: publicPromptId(promptId), folderId: publicFolderId(folderId) };

    const first = await duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), input);
    const second = await duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), input);

    expect(first.name).toBe(COPY_NAME);
    expect(second.name).toBe(
      `${COPY_NAME}${NUMBERED_PROMPT_NAME_SEPARATOR}${FIRST_PROMPT_NAME_NUMBER}`,
    );
  });

  it('cuts a long name to the prompt name limit', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId, 'x'.repeat(PROMPT_NAME_MAX_LENGTH));

    const view = await duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
      folderId: publicFolderId(folderId),
    });

    expect(view.name).toHaveLength(PROMPT_NAME_MAX_LENGTH);
    expect(view.name.endsWith(DUPLICATE_PROMPT_NAME_SUFFIX)).toBe(true);
  });

  it('reuses the name of a deleted prompt', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const deletedPromptId = await seedPrompt(workspaceId, folderId, COPY_NAME);
    const promptId = await seedPrompt(workspaceId, folderId);
    await tenants.run(workspaceId, () =>
      prompts.softDelete(workspaceId, deletedPromptId, PROMPTS_TEST_LATER),
    );

    const view = await duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
      folderId: publicFolderId(folderId),
    });

    expect(view.name).toBe(COPY_NAME);
  });

  it('refuses an unknown prompt', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);

    const attempt = duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(ids.generate()),
      folderId: publicFolderId(folderId),
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

    const attempt = duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
      folderId: publicFolderId(folderId),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
  });

  it('refuses an unknown folder', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId);

    const attempt = duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
      folderId: publicFolderId(ids.generate()),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
  });

  it('refuses a deleted folder', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const targetFolderId = await seedFolder(workspaceId, TEST_FOLDER_NEW_NAME);
    const promptId = await seedPrompt(workspaceId, folderId);
    await tenants.run(workspaceId, () =>
      folders.softDelete(workspaceId, targetFolderId, PROMPTS_TEST_LATER),
    );

    const attempt = duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
      folderId: publicFolderId(targetFolderId),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
  });

  it('never duplicates the prompt of another workspace', async () => {
    const workspaceA = ids.generate();
    const workspaceB = ids.generate();
    const folderId = await seedFolder(workspaceA);
    const promptId = await seedPrompt(workspaceA, folderId);
    const targetFolderId = await seedFolder(workspaceB);

    const attempt = duplicatePrompt.execute(promptsCtx(testingModule, workspaceB), {
      id: publicPromptId(promptId),
      folderId: publicFolderId(targetFolderId),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
    const stored = await tenants.run(workspaceA, () => prompts.list(workspaceA));
    expect(stored).toHaveLength(1);
  });

  it('never duplicates into the folder of another workspace', async () => {
    const workspaceA = ids.generate();
    const workspaceB = ids.generate();
    const folderA = await seedFolder(workspaceA);
    const folderB = await seedFolder(workspaceB);
    const promptId = await seedPrompt(workspaceB, folderB);

    const attempt = duplicatePrompt.execute(promptsCtx(testingModule, workspaceB), {
      id: publicPromptId(promptId),
      folderId: publicFolderId(folderA),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptFolderNotFoundError);
    const stored = await tenants.run(workspaceB, () => prompts.list(workspaceB));
    expect(stored).toHaveLength(1);
  });

  it('rejects an empty id and folder id', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId);

    await expect(
      duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), {
        id: '',
        folderId: publicFolderId(folderId),
      }),
    ).rejects.toMatchObject({ fields: [{ path: 'id', reason: ErrorReason.InvalidId }] });
    await expect(
      duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), {
        id: publicPromptId(promptId),
        folderId: '',
      }),
    ).rejects.toMatchObject({ fields: [{ path: 'folderId', reason: ErrorReason.InvalidId }] });
  });

  it('rejects a malformed id', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);

    const attempt = duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: 'nope',
      folderId: publicFolderId(folderId),
    });

    await expect(attempt).rejects.toBeInstanceOf(InvalidIdError);
  });

  it('rejects a malformed folder id', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId);

    const attempt = duplicatePrompt.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(promptId),
      folderId: 'nope',
    });

    await expect(attempt).rejects.toBeInstanceOf(InvalidIdError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedFolder(workspaceId);
    const promptId = await seedPrompt(workspaceId, folderId);

    const attempt = duplicatePrompt.execute(
      promptsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { id: publicPromptId(promptId), folderId: publicFolderId(folderId) },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
