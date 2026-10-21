import { LlmKeyVendor } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LLM_KEY_CHECK_RATE_LIMIT } from '@/modules/llm-keys/constants/llm-key-rate-limit.constants';
import { CheckLlmKeyUseCase } from '@/modules/llm-keys/use-cases/check-llm-key.use-case';
import { IdService } from '@/platform/ids/services/id.service';
import { FakeLlmModelListGateway } from '@/platform/llm/gateways/llm-model-list.fake';
import { RateLimitedError } from '@/platform/rate-limit/errors/rate-limited.error';
import {
  TEST_CUSTOM_BASE_URL,
  TEST_LLM_API_KEY,
  TEST_LLM_MODELS,
} from '@test/support/constants/llm-keys-testing.constants';
import {
  createLlmKeysTestingModule,
  llmKeysCtx,
  seedLlmKeyAuthor,
} from '@test/support/helpers/llm-keys-testing.helpers';

describe('CheckLlmKeyUseCase', () => {
  let testingModule: TestingModule;
  let checkLlmKey: CheckLlmKeyUseCase;
  let models: FakeLlmModelListGateway;
  let ids: IdService;
  let authorId: string;

  beforeAll(async () => {
    testingModule = await createLlmKeysTestingModule();
    checkLlmKey = testingModule.get(CheckLlmKeyUseCase);
    models = testingModule.get(FakeLlmModelListGateway).answer(TEST_LLM_MODELS);
    ids = testingModule.get(IdService);
    authorId = await seedLlmKeyAuthor(testingModule);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('returns the models the key can use', async () => {
    const result = await checkLlmKey.execute(llmKeysCtx(authorId, ids.generate()), {
      vendor: LlmKeyVendor.Custom,
      apiKey: TEST_LLM_API_KEY,
      baseUrl: TEST_CUSTOM_BASE_URL,
    });

    expect(result).toEqual({ models: TEST_LLM_MODELS });
    expect(models.keys.at(-1)).toMatchObject({
      vendor: LlmKeyVendor.Custom,
      baseUrl: TEST_CUSTOM_BASE_URL,
      apiKey: TEST_LLM_API_KEY,
    });
  });

  it('stops checking after the hourly limit of the workspace', async () => {
    const ctx = llmKeysCtx(authorId, ids.generate());
    const input = { vendor: LlmKeyVendor.OpenAi, apiKey: TEST_LLM_API_KEY };
    for (let check = 0; check < LLM_KEY_CHECK_RATE_LIMIT.capacity; check += 1) {
      await checkLlmKey.execute(ctx, input);
    }
    const calls = models.keys.length;

    await expect(checkLlmKey.execute(ctx, input)).rejects.toBeInstanceOf(RateLimitedError);
    expect(models.keys).toHaveLength(calls);
    await expect(checkLlmKey.execute(llmKeysCtx(authorId, ids.generate()), input)).resolves.toEqual(
      { models: TEST_LLM_MODELS },
    );
  });
});
