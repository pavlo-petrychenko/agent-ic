import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LlmKeyNotFoundError } from '@/modules/llm-keys/errors/llm-key-not-found.error';
import { SetLlmKeyFallbackUseCase } from '@/modules/llm-keys/use-cases/set-llm-key-fallback.use-case';
import { IdService } from '@/platform/ids/services/id.service';
import { LlmKeyResolver } from '@/platform/llm/services/llm-key-resolver.service';
import {
  createLlmKeysTestingModule,
  llmKeysCtx,
  publicLlmKeyId,
  seedLlmKey,
  seedLlmKeyAuthor,
} from '@test/support/helpers/llm-keys-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';

describe('SetLlmKeyFallbackUseCase', () => {
  let testingModule: TestingModule;
  let setFallback: SetLlmKeyFallbackUseCase;
  let resolver: LlmKeyResolver;
  let ids: IdService;
  let authorId: string;

  beforeAll(async () => {
    testingModule = await createLlmKeysTestingModule();
    setFallback = testingModule.get(SetLlmKeyFallbackUseCase);
    resolver = testingModule.get(LlmKeyResolver);
    ids = testingModule.get(IdService);
    authorId = await seedLlmKeyAuthor(testingModule);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('switches the fallback on and the gateway sees it', async () => {
    const workspaceId = ids.generate();
    await ensureWorkspaceRow(testingModule, workspaceId);
    const keyId = await seedLlmKey(testingModule, workspaceId, authorId);

    const view = await setFallback.execute(llmKeysCtx(authorId, workspaceId), {
      id: publicLlmKeyId(testingModule, keyId),
      enabled: true,
    });

    expect(view.fallbackToPlatform).toBe(true);
    await expect(resolver.resolve(workspaceId, keyId)).resolves.toMatchObject({
      fallbackToPlatform: true,
    });
  });

  it('refuses a key that does not exist', async () => {
    await expect(
      setFallback.execute(llmKeysCtx(authorId, ids.generate()), {
        id: publicLlmKeyId(testingModule, ids.generate()),
        enabled: true,
      }),
    ).rejects.toBeInstanceOf(LlmKeyNotFoundError);
  });
});
