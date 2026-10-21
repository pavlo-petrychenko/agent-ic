import { LlmKeyVendor } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LlmKeyNotFoundError } from '@/modules/llm-keys/errors/llm-key-not-found.error';
import { IdService } from '@/platform/ids/services/id.service';
import { LlmKeyResolver } from '@/platform/llm/services/llm-key-resolver.service';
import {
  TEST_CUSTOM_BASE_URL,
  TEST_CUSTOM_KEY_NAME,
  TEST_LLM_API_KEY,
} from '@test/support/constants/llm-keys-testing.constants';
import {
  createLlmKeysTestingModule,
  seedLlmKey,
  seedLlmKeyAuthor,
} from '@test/support/helpers/llm-keys-testing.helpers';

describe('LlmKeyResolverService', () => {
  let testingModule: TestingModule;
  let resolver: LlmKeyResolver;
  let ids: IdService;
  let authorId: string;

  beforeAll(async () => {
    testingModule = await createLlmKeysTestingModule();
    resolver = testingModule.get(LlmKeyResolver);
    ids = testingModule.get(IdService);
    authorId = await seedLlmKeyAuthor(testingModule);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('opens the sealed key of the workspace', async () => {
    const workspaceId = ids.generate();
    const keyId = await seedLlmKey(testingModule, workspaceId, authorId, {
      vendor: LlmKeyVendor.Custom,
      name: TEST_CUSTOM_KEY_NAME,
      baseUrl: TEST_CUSTOM_BASE_URL,
      fallbackToPlatform: true,
    });

    await expect(resolver.resolve(workspaceId, keyId)).resolves.toEqual({
      id: keyId,
      vendor: LlmKeyVendor.Custom,
      baseUrl: TEST_CUSTOM_BASE_URL,
      apiKey: TEST_LLM_API_KEY,
      fallbackToPlatform: true,
    });
  });

  it('does not resolve a key of another workspace', async () => {
    const owner = ids.generate();
    const keyId = await seedLlmKey(testingModule, owner, authorId);

    await expect(resolver.resolve(ids.generate(), keyId)).rejects.toBeInstanceOf(
      LlmKeyNotFoundError,
    );
  });

  it('refuses a key that does not exist', async () => {
    await expect(resolver.resolve(ids.generate(), ids.generate())).rejects.toBeInstanceOf(
      LlmKeyNotFoundError,
    );
  });
});
