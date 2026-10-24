import { LlmKeyVendor, WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ListLlmKeyOptionsUseCase } from '@/modules/llm-keys/use-cases/list-llm-key-options.use-case';
import { IdService } from '@/platform/ids/services/id.service';
import {
  createLlmKeysTestingModule,
  llmKeysCtx,
  publicLlmKeyId,
  seedLlmKey,
  seedLlmKeyAuthor,
} from '@test/support/helpers/llm-keys-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';

describe('ListLlmKeyOptionsUseCase', () => {
  let testingModule: TestingModule;
  let listLlmKeyOptions: ListLlmKeyOptionsUseCase;
  let ids: IdService;
  let authorId: string;

  beforeAll(async () => {
    testingModule = await createLlmKeysTestingModule();
    listLlmKeyOptions = testingModule.get(ListLlmKeyOptionsUseCase);
    ids = testingModule.get(IdService);
    authorId = await seedLlmKeyAuthor(testingModule);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('gives a builder the id, vendor and name of every key', async () => {
    const workspaceId = ids.generate();
    await ensureWorkspaceRow(testingModule, workspaceId);
    const keyId = await seedLlmKey(testingModule, workspaceId, authorId);
    await seedLlmKey(testingModule, ids.generate(), authorId);

    const options = await listLlmKeyOptions.execute(
      llmKeysCtx(authorId, workspaceId, WorkspaceRole.Builder),
    );

    expect(options).toEqual([
      { id: publicLlmKeyId(testingModule, keyId), vendor: LlmKeyVendor.OpenAi, name: 'OpenAI' },
    ]);
  });
});
