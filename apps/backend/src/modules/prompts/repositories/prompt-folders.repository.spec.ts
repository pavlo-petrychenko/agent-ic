import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import type { NewPromptFolder } from '@/modules/prompts/typedefs/prompt-folder.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { ROW_LEVEL_SECURITY_VIOLATION } from '@test/support/constants/postgres-errors.constants';
import {
  PROMPTS_TEST_LATER,
  PROMPTS_TEST_START,
  TEST_FOLDER_NAME,
  TEST_FOLDER_NEW_NAME,
} from '@test/support/constants/prompts-testing.constants';
import { newFolder } from '@test/support/fixtures/prompts.fixture';
import { createPromptsTestingModule } from '@test/support/helpers/prompts-testing.helpers';

describe('PromptFoldersRepository', () => {
  let testingModule: TestingModule;
  let repository: PromptFoldersRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    repository = testingModule.get(PromptFoldersRepository);
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
      repository.insert(newFolder(folderId, workspaceId, overrides)),
    );
    return folderId;
  };

  it('stores a folder and finds it by id', async () => {
    const workspaceId = ids.generate();
    const folderId = await insertFolder(workspaceId);

    const found = await tenants.run(workspaceId, () => repository.findById(workspaceId, folderId));

    expect(found).toMatchObject({
      id: folderId,
      workspaceId,
      name: TEST_FOLDER_NAME,
      createdAt: PROMPTS_TEST_START,
      updatedAt: PROMPTS_TEST_START,
      deletedAt: null,
    });
  });

  it('finds a folder by name regardless of case', async () => {
    const workspaceId = ids.generate();
    const folderId = await insertFolder(workspaceId);

    const found = await tenants.run(workspaceId, () =>
      repository.findByName(workspaceId, TEST_FOLDER_NAME.toUpperCase()),
    );

    expect(found?.id).toBe(folderId);
  });

  it('renames a folder', async () => {
    const workspaceId = ids.generate();
    const folderId = await insertFolder(workspaceId);

    const renamed = await tenants.run(workspaceId, () =>
      repository.rename(workspaceId, folderId, TEST_FOLDER_NEW_NAME),
    );
    const found = await tenants.run(workspaceId, () => repository.findById(workspaceId, folderId));

    expect(renamed).toBe(true);
    expect(found?.name).toBe(TEST_FOLDER_NEW_NAME);
  });

  it('lists folders by name and hides soft-deleted ones', async () => {
    const workspaceId = ids.generate();
    const deletedId = await insertFolder(workspaceId, { name: 'Alpha' });
    await insertFolder(workspaceId, { name: 'Zulu' });

    await tenants.run(workspaceId, () =>
      repository.softDelete(workspaceId, deletedId, PROMPTS_TEST_LATER),
    );
    const listed = await tenants.run(workspaceId, () => repository.listByWorkspace(workspaceId));

    expect(listed.map((folder) => folder.name)).toEqual(['Zulu']);
  });

  it('soft deletes once and frees the name', async () => {
    const workspaceId = ids.generate();
    const folderId = await insertFolder(workspaceId);

    const results = await tenants.run(workspaceId, async () => ({
      deleted: await repository.softDelete(workspaceId, folderId, PROMPTS_TEST_LATER),
      deletedAgain: await repository.softDelete(workspaceId, folderId, PROMPTS_TEST_LATER),
    }));
    const found = await tenants.run(workspaceId, () => repository.findById(workspaceId, folderId));
    const byName = await tenants.run(workspaceId, () =>
      repository.findByName(workspaceId, TEST_FOLDER_NAME),
    );

    expect(results).toEqual({ deleted: true, deletedAgain: false });
    expect(found).toBeNull();
    expect(byName).toBeNull();
    await expect(insertFolder(workspaceId)).resolves.toEqual(expect.any(String));
  });

  describe('across tenants', () => {
    it('never shows, changes or deletes the folder of another workspace', async () => {
      const workspaceA = ids.generate();
      const workspaceB = ids.generate();
      const folderId = await insertFolder(workspaceA);

      const fromB = await tenants.run(workspaceB, async () => ({
        found: await repository.findById(workspaceA, folderId),
        byName: await repository.findByName(workspaceA, TEST_FOLDER_NAME),
        list: await repository.listByWorkspace(workspaceA),
        renamed: await repository.rename(workspaceA, folderId, TEST_FOLDER_NEW_NAME),
        deleted: await repository.softDelete(workspaceA, folderId, PROMPTS_TEST_LATER),
      }));
      const ownFromA = await tenants.run(workspaceA, () =>
        repository.findById(workspaceA, folderId),
      );

      expect(fromB).toEqual({
        found: null,
        byName: null,
        list: [],
        renamed: false,
        deleted: false,
      });
      expect(ownFromA?.name).not.toBe(TEST_FOLDER_NEW_NAME);
    });

    it('shows nothing without a tenant', async () => {
      const workspaceId = ids.generate();
      const folderId = await insertFolder(workspaceId);

      expect(await repository.findById(workspaceId, folderId)).toBeNull();
    });

    it('refuses to write a folder into another workspace', async () => {
      const workspaceA = ids.generate();
      const workspaceB = ids.generate();

      const write = tenants.run(workspaceB, () =>
        repository.insert(newFolder(ids.generate(), workspaceA)),
      );

      await expect(write).rejects.toMatchObject(ROW_LEVEL_SECURITY_VIOLATION);
    });
  });
});
