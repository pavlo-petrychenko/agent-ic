import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import type { NewPromptFolder } from '@/modules/prompts/typedefs/prompt-folder.typedefs';
import type { NewPrompt } from '@/modules/prompts/typedefs/prompt.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { ROW_LEVEL_SECURITY_VIOLATION } from '@test/support/constants/postgres-errors.constants';
import {
  PROMPTS_TEST_LATER,
  PROMPTS_TEST_START,
  TEST_FOLDER_NEW_NAME,
  TEST_PROMPT_NAME,
  TEST_PROMPT_NEW_NAME,
} from '@test/support/constants/prompts-testing.constants';
import { newFolder, newPrompt } from '@test/support/fixtures/prompts.fixture';
import { createPromptsTestingModule } from '@test/support/helpers/prompts-testing.helpers';

describe('PromptsRepository', () => {
  let testingModule: TestingModule;
  let folders: PromptFoldersRepository;
  let repository: PromptsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    folders = testingModule.get(PromptFoldersRepository);
    repository = testingModule.get(PromptsRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const insertFolder = async (
    workspaceId: string,
    overrides: Partial<NewPromptFolder> = {},
  ): Promise<string> => {
    const folderId = ids.generate();
    await tenants.run(workspaceId, () =>
      folders.insert(newFolder(folderId, workspaceId, overrides)),
    );
    return folderId;
  };

  const insertPrompt = async (
    workspaceId: string,
    overrides: Partial<NewPrompt> = {},
  ): Promise<string> => {
    const promptId = ids.generate();
    const folderId =
      overrides.folderId ?? (await insertFolder(workspaceId, { name: `Folder ${promptId}` }));
    await tenants.run(workspaceId, () =>
      repository.insert(newPrompt(promptId, workspaceId, folderId, overrides)),
    );
    return promptId;
  };

  it('stores a prompt and finds it by id', async () => {
    const workspaceId = ids.generate();
    const folderId = await insertFolder(workspaceId);
    const promptId = await insertPrompt(workspaceId, { folderId });

    const found = await tenants.run(workspaceId, () => repository.findById(workspaceId, promptId));

    expect(found).toMatchObject({
      id: promptId,
      workspaceId,
      name: TEST_PROMPT_NAME,
      folderId,
      createdByUserId: null,
      createdAt: PROMPTS_TEST_START,
      updatedAt: PROMPTS_TEST_START,
      deletedAt: null,
    });
  });

  it('finds a prompt by name regardless of case', async () => {
    const workspaceId = ids.generate();
    const promptId = await insertPrompt(workspaceId);

    const found = await tenants.run(workspaceId, () =>
      repository.findByName(workspaceId, TEST_PROMPT_NAME.toUpperCase()),
    );

    expect(found?.id).toBe(promptId);
  });

  it('moves a prompt between folders and moves updatedAt forward', async () => {
    const workspaceId = ids.generate();
    const folderId = await insertFolder(workspaceId);
    const otherFolderId = await insertFolder(workspaceId, { name: TEST_FOLDER_NEW_NAME });
    const promptId = await insertPrompt(workspaceId, { folderId });

    const moved = await tenants.run(workspaceId, () =>
      repository.moveToFolder(workspaceId, promptId, otherFolderId),
    );
    const found = await tenants.run(workspaceId, () => repository.findById(workspaceId, promptId));

    expect(moved?.folderId).toBe(otherFolderId);
    expect(found?.folderId).toBe(otherFolderId);
    expect(found?.updatedAt.getTime()).toBeGreaterThan(PROMPTS_TEST_START.getTime());
  });

  it('renames a prompt', async () => {
    const workspaceId = ids.generate();
    const promptId = await insertPrompt(workspaceId);

    const renamed = await tenants.run(workspaceId, () =>
      repository.rename(workspaceId, promptId, TEST_PROMPT_NEW_NAME),
    );
    const found = await tenants.run(workspaceId, () => repository.findById(workspaceId, promptId));

    expect(renamed).toMatchObject({ name: TEST_PROMPT_NEW_NAME });
    expect(found).toMatchObject({ name: TEST_PROMPT_NEW_NAME });
  });

  it('lists the prompts in creation order', async () => {
    const workspaceId = ids.generate();
    const created = [
      await insertPrompt(workspaceId, { name: 'Alpha' }),
      await insertPrompt(workspaceId, { name: 'Bravo' }),
      await insertPrompt(workspaceId, { name: 'Charlie' }),
    ];

    const listed = await tenants.run(workspaceId, () => repository.list(workspaceId));

    expect(listed.map((prompt) => prompt.id)).toEqual(created);
  });

  it('filters a list by folder and by name', async () => {
    const workspaceId = ids.generate();
    const folderId = await insertFolder(workspaceId);
    const otherFolderId = await insertFolder(workspaceId, { name: TEST_FOLDER_NEW_NAME });
    const receptionist = await insertPrompt(workspaceId, { name: TEST_PROMPT_NAME, folderId });
    const concierge = await insertPrompt(workspaceId, {
      name: TEST_PROMPT_NEW_NAME,
      folderId: otherFolderId,
    });
    const notes = await insertPrompt(workspaceId, { name: 'Reception notes', folderId });

    const inFolder = await tenants.run(workspaceId, () =>
      repository.list(workspaceId, { folderId, search: null }),
    );
    const searched = await tenants.run(workspaceId, () =>
      repository.list(workspaceId, { folderId: null, search: 'conci' }),
    );
    const byName = await tenants.run(workspaceId, () =>
      repository.list(workspaceId, { folderId: null, search: 'ReCePtIoN' }),
    );

    expect(inFolder.map((prompt) => prompt.id)).toEqual([receptionist, notes]);
    expect(searched.map((prompt) => prompt.id)).toEqual([concierge]);
    expect(byName.map((prompt) => prompt.id)).toEqual([receptionist, notes]);
  });

  it('lists the prompts of several folders at once', async () => {
    const workspaceId = ids.generate();
    const folderId = await insertFolder(workspaceId);
    const otherFolderId = await insertFolder(workspaceId, { name: TEST_FOLDER_NEW_NAME });
    const thirdFolderId = await insertFolder(workspaceId, { name: 'Third' });
    const receptionist = await insertPrompt(workspaceId, { name: 'Receptionist', folderId });
    const concierge = await insertPrompt(workspaceId, {
      name: 'Concierge',
      folderId: otherFolderId,
    });
    await insertPrompt(workspaceId, { name: 'Gift card', folderId: thirdFolderId });

    const listed = await tenants.run(workspaceId, () =>
      repository.listByFolderIds(workspaceId, [folderId, otherFolderId]),
    );

    expect(listed.map((prompt) => prompt.id)).toEqual([receptionist, concierge]);
  });

  it('finds a prompt for update and hides it once deleted', async () => {
    const workspaceId = ids.generate();
    const promptId = await insertPrompt(workspaceId);

    const locked = await tenants.run(workspaceId, () =>
      repository.findByIdForUpdate(workspaceId, promptId),
    );
    await tenants.run(workspaceId, () =>
      repository.softDelete(workspaceId, promptId, PROMPTS_TEST_LATER),
    );
    const afterDelete = await tenants.run(workspaceId, () =>
      repository.findByIdForUpdate(workspaceId, promptId),
    );

    expect(locked?.id).toBe(promptId);
    expect(afterDelete).toBeNull();
  });

  it('soft deletes once and frees the name', async () => {
    const workspaceId = ids.generate();
    const promptId = await insertPrompt(workspaceId);

    const results = await tenants.run(workspaceId, async () => ({
      deleted: await repository.softDelete(workspaceId, promptId, PROMPTS_TEST_LATER),
      deletedAgain: await repository.softDelete(workspaceId, promptId, PROMPTS_TEST_LATER),
    }));
    const found = await tenants.run(workspaceId, () => repository.findById(workspaceId, promptId));
    const byName = await tenants.run(workspaceId, () =>
      repository.findByName(workspaceId, TEST_PROMPT_NAME),
    );

    expect(results).toEqual({ deleted: true, deletedAgain: false });
    expect(found).toBeNull();
    expect(byName).toBeNull();
    await expect(insertPrompt(workspaceId)).resolves.toEqual(expect.any(String));
  });

  describe('countByFolder', () => {
    it('counts the active prompts of one folder only', async () => {
      const workspaceId = ids.generate();
      const folderId = await insertFolder(workspaceId);
      const otherFolderId = await insertFolder(workspaceId, { name: TEST_FOLDER_NEW_NAME });
      await insertPrompt(workspaceId, { folderId });
      await insertPrompt(workspaceId, { name: TEST_PROMPT_NEW_NAME, folderId });
      await insertPrompt(workspaceId, { name: 'Other', folderId: otherFolderId });
      const deletedPrompt = await insertPrompt(workspaceId, { name: 'Deleted', folderId });
      await tenants.run(workspaceId, () =>
        repository.softDelete(workspaceId, deletedPrompt, PROMPTS_TEST_LATER),
      );

      const count = await tenants.run(workspaceId, () =>
        repository.countByFolder(workspaceId, folderId),
      );

      expect(count).toBe(2);
    });

    it('never counts the prompts of another workspace', async () => {
      const workspaceA = ids.generate();
      const workspaceB = ids.generate();
      const folderId = await insertFolder(workspaceA);
      await insertPrompt(workspaceA, { folderId });

      const count = await tenants.run(workspaceB, () =>
        repository.countByFolder(workspaceA, folderId),
      );

      expect(count).toBe(0);
    });
  });

  describe('across tenants', () => {
    it('never shows, changes or deletes the prompt of another workspace', async () => {
      const workspaceA = ids.generate();
      const workspaceB = ids.generate();
      const folderId = await insertFolder(workspaceA);
      const promptId = await insertPrompt(workspaceA);

      const fromB = await tenants.run(workspaceB, async () => ({
        found: await repository.findById(workspaceA, promptId),
        byName: await repository.findByName(workspaceA, TEST_PROMPT_NAME),
        listed: await repository.list(workspaceA),
        locked: await repository.findByIdForUpdate(workspaceA, promptId),
        renamed: await repository.rename(workspaceA, promptId, TEST_PROMPT_NEW_NAME),
        moved: await repository.moveToFolder(workspaceA, promptId, folderId),
        deleted: await repository.softDelete(workspaceA, promptId, PROMPTS_TEST_LATER),
      }));
      const ownFromA = await tenants.run(workspaceA, () =>
        repository.findById(workspaceA, promptId),
      );

      expect(fromB).toEqual({
        found: null,
        byName: null,
        listed: [],
        locked: null,
        renamed: null,
        moved: null,
        deleted: false,
      });
      expect(ownFromA?.name).not.toBe(TEST_PROMPT_NEW_NAME);
    });

    it('shows nothing without a tenant', async () => {
      const workspaceId = ids.generate();
      const promptId = await insertPrompt(workspaceId);

      expect(await repository.findById(workspaceId, promptId)).toBeNull();
      expect(await repository.list(workspaceId)).toEqual([]);
    });

    it('refuses to write a prompt into another workspace', async () => {
      const workspaceA = ids.generate();
      const workspaceB = ids.generate();
      const folderId = await insertFolder(workspaceA);

      const write = tenants.run(workspaceB, () =>
        repository.insert(newPrompt(ids.generate(), workspaceA, folderId)),
      );

      await expect(write).rejects.toMatchObject(ROW_LEVEL_SECURITY_VIOLATION);
    });
  });
});
