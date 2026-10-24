import { WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LlmKeyNotFoundError } from '@/modules/llm-keys/errors/llm-key-not-found.error';
import { ListLlmKeyModelsUseCase } from '@/modules/llm-keys/use-cases/list-llm-key-models.use-case';
import { IdService } from '@/platform/ids/services/id.service';
import { FakeLlmModelListGateway } from '@/platform/llm/gateways/llm-model-list.fake';
import {
  TEST_LLM_API_KEY,
  TEST_LLM_MODELS,
  TEST_LLM_OTHER_MODELS,
} from '@test/support/constants/llm-keys-testing.constants';
import {
  createLlmKeysTestingModule,
  llmKeysCtx,
  publicLlmKeyId,
  seedLlmKey,
  seedLlmKeyAuthor,
} from '@test/support/helpers/llm-keys-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';

describe('ListLlmKeyModelsUseCase', () => {
  let testingModule: TestingModule;
  let listLlmKeyModels: ListLlmKeyModelsUseCase;
  let models: FakeLlmModelListGateway;
  let ids: IdService;
  let authorId: string;

  beforeAll(async () => {
    testingModule = await createLlmKeysTestingModule();
    listLlmKeyModels = testingModule.get(ListLlmKeyModelsUseCase);
    models = testingModule.get(FakeLlmModelListGateway);
    ids = testingModule.get(IdService);
    authorId = await seedLlmKeyAuthor(testingModule);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('lists the models of the key for a builder and keeps them for a while', async () => {
    const workspaceId = ids.generate();
    await ensureWorkspaceRow(testingModule, workspaceId);
    const keyId = await seedLlmKey(testingModule, workspaceId, authorId);
    const ctx = llmKeysCtx(authorId, workspaceId, WorkspaceRole.Builder);
    const input = { id: publicLlmKeyId(testingModule, keyId) };
    models.answer(TEST_LLM_MODELS);

    const first = await listLlmKeyModels.execute(ctx, input);
    models.answer(TEST_LLM_OTHER_MODELS);
    const second = await listLlmKeyModels.execute(ctx, input);

    expect(first).toEqual(TEST_LLM_MODELS);
    expect(second).toEqual(TEST_LLM_MODELS);
    expect(models.keys.at(-1)).toMatchObject({ id: keyId, apiKey: TEST_LLM_API_KEY });
  });

  it('refuses a key of another workspace', async () => {
    const keyId = await seedLlmKey(testingModule, ids.generate(), authorId);

    await expect(
      listLlmKeyModels.execute(llmKeysCtx(authorId, ids.generate()), {
        id: publicLlmKeyId(testingModule, keyId),
      }),
    ).rejects.toBeInstanceOf(LlmKeyNotFoundError);
  });
});
