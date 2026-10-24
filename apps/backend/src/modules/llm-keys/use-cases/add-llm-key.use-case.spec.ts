import { IdPrefix, LlmKeyVendor, WorkspaceRole } from '@agent-ic/contracts';
import { HttpStatus } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { InvalidLlmKeyInputError } from '@/modules/llm-keys/errors/invalid-llm-key-input.error';
import { LlmKeyNameTakenError } from '@/modules/llm-keys/errors/llm-key-name-taken.error';
import { LlmKeyVendorTakenError } from '@/modules/llm-keys/errors/llm-key-vendor-taken.error';
import { LlmKeysRepository } from '@/modules/llm-keys/repositories/llm-keys.repository';
import { AddLlmKeyUseCase } from '@/modules/llm-keys/use-cases/add-llm-key.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { LlmKeyEndpointBlockedError } from '@/platform/llm/errors/llm-key-endpoint-blocked.error';
import { LlmKeyInvalidError } from '@/platform/llm/errors/llm-key-invalid.error';
import { FakeLlmModelListGateway } from '@/platform/llm/gateways/llm-model-list.fake';
import { LlmKeyResolver } from '@/platform/llm/services/llm-key-resolver.service';
import {
  TEST_CUSTOM_BASE_URL,
  TEST_CUSTOM_HTTP_BASE_URL,
  TEST_CUSTOM_INVALID_BASE_URL,
  TEST_CUSTOM_KEY_NAME,
  TEST_LLM_API_KEY,
  TEST_LLM_API_KEY_LAST4,
  TEST_LLM_KEY_AUTHOR_NAME,
  TEST_LLM_MODELS,
  TEST_LLM_OTHER_API_KEY,
  TEST_LLM_SHORT_API_KEY,
  TEST_SEALED_KEY_PREFIX,
} from '@test/support/constants/llm-keys-testing.constants';
import {
  createLlmKeysTestingModule,
  llmKeysCtx,
  seedLlmKeyAuthor,
} from '@test/support/helpers/llm-keys-testing.helpers';

describe('AddLlmKeyUseCase', () => {
  let testingModule: TestingModule;
  let addLlmKey: AddLlmKeyUseCase;
  let keys: LlmKeysRepository;
  let resolver: LlmKeyResolver;
  let models: FakeLlmModelListGateway;
  let tenants: TenantTransactionService;
  let ids: IdService;
  let authorId: string;

  beforeAll(async () => {
    testingModule = await createLlmKeysTestingModule();
    addLlmKey = testingModule.get(AddLlmKeyUseCase);
    keys = testingModule.get(LlmKeysRepository);
    resolver = testingModule.get(LlmKeyResolver);
    models = testingModule.get(FakeLlmModelListGateway);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
    authorId = await seedLlmKeyAuthor(testingModule);
  });

  beforeEach(() => {
    models.answer(TEST_LLM_MODELS);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('checks the key, seals it and returns the view', async () => {
    const workspaceId = ids.generate();

    const view = await addLlmKey.execute(llmKeysCtx(authorId, workspaceId), {
      vendor: LlmKeyVendor.OpenAi,
      apiKey: ` ${TEST_LLM_API_KEY} `,
      fallbackToPlatform: true,
    });

    const keyId = ids.fromPublic(IdPrefix.LlmKey, view.id);
    const stored = await tenants.run(workspaceId, () => keys.findById(workspaceId, keyId));
    expect(view).toMatchObject({
      vendor: LlmKeyVendor.OpenAi,
      name: 'OpenAI',
      baseUrl: null,
      keyLast4: TEST_LLM_API_KEY_LAST4,
      fallbackToPlatform: true,
      addedBy: TEST_LLM_KEY_AUTHOR_NAME,
      usedBySteps: 0,
    });
    expect(models.keys.at(-1)).toMatchObject({
      vendor: LlmKeyVendor.OpenAi,
      apiKey: TEST_LLM_API_KEY,
      baseUrl: null,
    });
    expect(stored?.sealedKey.startsWith(TEST_SEALED_KEY_PREFIX)).toBe(true);
    expect(stored?.sealedKey).not.toContain(TEST_LLM_API_KEY);
    await expect(resolver.resolve(workspaceId, keyId)).resolves.toMatchObject({
      apiKey: TEST_LLM_API_KEY,
      fallbackToPlatform: true,
    });
  });

  it('stores a custom endpoint with its name and base URL', async () => {
    const workspaceId = ids.generate();

    const view = await addLlmKey.execute(llmKeysCtx(authorId, workspaceId), {
      vendor: LlmKeyVendor.Custom,
      apiKey: TEST_LLM_API_KEY,
      name: TEST_CUSTOM_KEY_NAME,
      baseUrl: TEST_CUSTOM_BASE_URL,
      fallbackToPlatform: false,
    });

    expect(view).toMatchObject({
      vendor: LlmKeyVendor.Custom,
      name: TEST_CUSTOM_KEY_NAME,
      baseUrl: TEST_CUSTOM_BASE_URL,
    });
    expect(models.keys.at(-1)).toMatchObject({ baseUrl: TEST_CUSTOM_BASE_URL });
  });

  it('refuses a second key for the same vendor', async () => {
    const workspaceId = ids.generate();
    const ctx = llmKeysCtx(authorId, workspaceId);
    const input = {
      vendor: LlmKeyVendor.Anthropic,
      apiKey: TEST_LLM_API_KEY,
      fallbackToPlatform: false,
    };
    await addLlmKey.execute(ctx, input);

    await expect(
      addLlmKey.execute(ctx, { ...input, apiKey: TEST_LLM_OTHER_API_KEY }),
    ).rejects.toBeInstanceOf(LlmKeyVendorTakenError);
  });

  it('refuses a custom endpoint named like another key', async () => {
    const workspaceId = ids.generate();
    const ctx = llmKeysCtx(authorId, workspaceId);
    await addLlmKey.execute(ctx, {
      vendor: LlmKeyVendor.Mistral,
      apiKey: TEST_LLM_API_KEY,
      fallbackToPlatform: false,
    });

    await expect(
      addLlmKey.execute(ctx, {
        vendor: LlmKeyVendor.Custom,
        apiKey: TEST_LLM_API_KEY,
        name: 'mistral',
        baseUrl: TEST_CUSTOM_BASE_URL,
        fallbackToPlatform: false,
      }),
    ).rejects.toBeInstanceOf(LlmKeyNameTakenError);
  });

  it.each([TEST_CUSTOM_HTTP_BASE_URL, TEST_CUSTOM_INVALID_BASE_URL])(
    'refuses the base URL %s without calling it',
    async (baseUrl) => {
      const workspaceId = ids.generate();
      const calls = models.keys.length;

      await expect(
        addLlmKey.execute(llmKeysCtx(authorId, workspaceId), {
          vendor: LlmKeyVendor.Custom,
          apiKey: TEST_LLM_API_KEY,
          name: TEST_CUSTOM_KEY_NAME,
          baseUrl,
          fallbackToPlatform: false,
        }),
      ).rejects.toBeInstanceOf(LlmKeyEndpointBlockedError);
      expect(models.keys).toHaveLength(calls);
    },
  );

  it('stores nothing when the vendor rejects the key', async () => {
    const workspaceId = ids.generate();
    models.fail(new LlmKeyInvalidError(LlmKeyVendor.OpenAi, HttpStatus.UNAUTHORIZED));

    await expect(
      addLlmKey.execute(llmKeysCtx(authorId, workspaceId), {
        vendor: LlmKeyVendor.OpenAi,
        apiKey: TEST_LLM_API_KEY,
        fallbackToPlatform: false,
      }),
    ).rejects.toBeInstanceOf(LlmKeyInvalidError);
    await expect(
      tenants.run(workspaceId, () => keys.listByWorkspace(workspaceId)),
    ).resolves.toEqual([]);
  });

  it.each([
    { vendor: LlmKeyVendor.OpenAi, apiKey: TEST_LLM_SHORT_API_KEY, fallbackToPlatform: false },
    {
      vendor: LlmKeyVendor.Custom,
      apiKey: TEST_LLM_API_KEY,
      baseUrl: TEST_CUSTOM_BASE_URL,
      fallbackToPlatform: false,
    },
    { vendor: 'xiaomi', apiKey: TEST_LLM_API_KEY, fallbackToPlatform: false },
  ])('refuses the input %o', async (input) => {
    await expect(
      addLlmKey.execute(llmKeysCtx(authorId, ids.generate()), input),
    ).rejects.toBeInstanceOf(InvalidLlmKeyInputError);
  });

  it('refuses a builder', async () => {
    await expect(
      addLlmKey.execute(llmKeysCtx(authorId, ids.generate(), WorkspaceRole.Builder), {
        vendor: LlmKeyVendor.OpenAi,
        apiKey: TEST_LLM_API_KEY,
        fallbackToPlatform: false,
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
