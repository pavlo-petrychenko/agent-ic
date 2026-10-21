import { LlmKeyVendor } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LlmKeysRepository } from '@/modules/llm-keys/repositories/llm-keys.repository';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  LLM_KEYS_TEST_LATER,
  TEST_CUSTOM_BASE_URL,
  TEST_CUSTOM_KEY_NAME,
} from '@test/support/constants/llm-keys-testing.constants';
import {
  createLlmKeysTestingModule,
  seedLlmKey,
  seedLlmKeyAuthor,
} from '@test/support/helpers/llm-keys-testing.helpers';

describe('LlmKeysRepository', () => {
  let testingModule: TestingModule;
  let keys: LlmKeysRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;
  let authorId: string;

  beforeAll(async () => {
    testingModule = await createLlmKeysTestingModule();
    keys = testingModule.get(LlmKeysRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
    authorId = await seedLlmKeyAuthor(testingModule);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('finds keys by id, vendor and name inside the workspace', async () => {
    const workspaceId = ids.generate();
    const vendorKeyId = await seedLlmKey(testingModule, workspaceId, authorId);
    const customKeyId = await seedLlmKey(testingModule, workspaceId, authorId, {
      vendor: LlmKeyVendor.Custom,
      name: TEST_CUSTOM_KEY_NAME,
      baseUrl: TEST_CUSTOM_BASE_URL,
    });

    const found = await tenants.run(workspaceId, async () => ({
      byId: await keys.findById(workspaceId, customKeyId),
      byVendor: await keys.findByVendor(workspaceId, LlmKeyVendor.OpenAi),
      byName: await keys.findByName(workspaceId, TEST_CUSTOM_KEY_NAME.toUpperCase()),
      listed: await keys.listByWorkspace(workspaceId),
    }));

    expect(found.byId?.baseUrl).toBe(TEST_CUSTOM_BASE_URL);
    expect(found.byVendor?.id).toBe(vendorKeyId);
    expect(found.byName?.id).toBe(customKeyId);
    expect(found.listed.map(({ id }) => id).sort()).toEqual([vendorKeyId, customKeyId].sort());
  });

  it('shows nothing of workspace A to workspace B', async () => {
    const workspaceA = ids.generate();
    const workspaceB = ids.generate();
    const keyId = await seedLlmKey(testingModule, workspaceA, authorId);

    const seen = await tenants.run(workspaceB, async () => ({
      byId: await keys.findById(workspaceA, keyId),
      byVendor: await keys.findByVendor(workspaceA, LlmKeyVendor.OpenAi),
      listed: await keys.listByWorkspace(workspaceA),
      updated: await keys.setFallback(workspaceA, keyId, true, LLM_KEYS_TEST_LATER),
      deleted: await keys.deleteById(workspaceA, keyId),
    }));

    expect(seen).toEqual({
      byId: null,
      byVendor: null,
      listed: [],
      updated: null,
      deleted: false,
    });
    const kept = await tenants.run(workspaceA, () => keys.findById(workspaceA, keyId));
    expect(kept?.fallbackToPlatform).toBe(false);
  });

  it('switches the fallback and deletes a key', async () => {
    const workspaceId = ids.generate();
    const keyId = await seedLlmKey(testingModule, workspaceId, authorId);

    const result = await tenants.run(workspaceId, async () => ({
      updated: await keys.setFallback(workspaceId, keyId, true, LLM_KEYS_TEST_LATER),
      deleted: await keys.deleteById(workspaceId, keyId),
      after: await keys.findById(workspaceId, keyId),
    }));

    expect(result.updated).toMatchObject({
      fallbackToPlatform: true,
      updatedAt: LLM_KEYS_TEST_LATER,
    });
    expect(result.deleted).toBe(true);
    expect(result.after).toBeNull();
  });
});
