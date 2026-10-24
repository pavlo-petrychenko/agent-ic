import { LlmKeyVendor, WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ListLlmKeysUseCase } from '@/modules/llm-keys/use-cases/list-llm-keys.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { IdService } from '@/platform/ids/services/id.service';
import {
  LLM_KEYS_TEST_LATER,
  LLM_KEYS_TEST_START,
  TEST_CUSTOM_BASE_URL,
  TEST_CUSTOM_KEY_NAME,
  TEST_LLM_API_KEY_LAST4,
  TEST_LLM_KEY_AUTHOR_NAME,
} from '@test/support/constants/llm-keys-testing.constants';
import { agentOnKey, agentOnPlatform, keyModelFlow } from '@test/support/fixtures/llm-keys.fixture';
import { seedAgentWithDraft } from '@test/support/helpers/agents-testing.helpers';
import {
  createLlmKeysTestingModule,
  llmKeysCtx,
  publicLlmKeyId,
  seedLlmKey,
  seedLlmKeyAuthor,
} from '@test/support/helpers/llm-keys-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';

describe('ListLlmKeysUseCase', () => {
  let testingModule: TestingModule;
  let listLlmKeys: ListLlmKeysUseCase;
  let ids: IdService;
  let authorId: string;

  beforeAll(async () => {
    testingModule = await createLlmKeysTestingModule();
    listLlmKeys = testingModule.get(ListLlmKeysUseCase);
    ids = testingModule.get(IdService);
    authorId = await seedLlmKeyAuthor(testingModule);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('lists the keys with their author and the steps that use them', async () => {
    const workspaceId = ids.generate();
    await ensureWorkspaceRow(testingModule, workspaceId);
    const usedKeyId = await seedLlmKey(testingModule, workspaceId, authorId);
    const customKeyId = await seedLlmKey(testingModule, workspaceId, authorId, {
      vendor: LlmKeyVendor.Custom,
      name: TEST_CUSTOM_KEY_NAME,
      baseUrl: TEST_CUSTOM_BASE_URL,
      createdAt: LLM_KEYS_TEST_LATER,
    });
    const usedKey = publicLlmKeyId(testingModule, usedKeyId);
    await seedAgentWithDraft(
      testingModule,
      workspaceId,
      keyModelFlow([agentOnKey('n_first', usedKey), agentOnPlatform('n_platform')]),
    );
    await seedAgentWithDraft(
      testingModule,
      workspaceId,
      keyModelFlow([agentOnKey('n_second', usedKey)]),
    );

    const listed = await listLlmKeys.execute(llmKeysCtx(authorId, workspaceId));

    expect(listed).toEqual([
      {
        id: usedKey,
        vendor: LlmKeyVendor.OpenAi,
        name: 'OpenAI',
        baseUrl: null,
        keyLast4: TEST_LLM_API_KEY_LAST4,
        fallbackToPlatform: false,
        addedBy: TEST_LLM_KEY_AUTHOR_NAME,
        createdAt: LLM_KEYS_TEST_START,
        usedBySteps: 2,
      },
      {
        id: publicLlmKeyId(testingModule, customKeyId),
        vendor: LlmKeyVendor.Custom,
        name: TEST_CUSTOM_KEY_NAME,
        baseUrl: TEST_CUSTOM_BASE_URL,
        keyLast4: TEST_LLM_API_KEY_LAST4,
        fallbackToPlatform: false,
        addedBy: TEST_LLM_KEY_AUTHOR_NAME,
        createdAt: LLM_KEYS_TEST_LATER,
        usedBySteps: 0,
      },
    ]);
  });

  it('refuses a builder', async () => {
    await expect(
      listLlmKeys.execute(llmKeysCtx(authorId, ids.generate(), WorkspaceRole.Builder)),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
