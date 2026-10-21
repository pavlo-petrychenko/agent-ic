import { WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LlmKeyNotFoundError } from '@/modules/llm-keys/errors/llm-key-not-found.error';
import { LlmKeysRepository } from '@/modules/llm-keys/repositories/llm-keys.repository';
import { RemoveLlmKeyUseCase } from '@/modules/llm-keys/use-cases/remove-llm-key.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  createLlmKeysTestingModule,
  llmKeysCtx,
  publicLlmKeyId,
  seedLlmKey,
  seedLlmKeyAuthor,
} from '@test/support/helpers/llm-keys-testing.helpers';

describe('RemoveLlmKeyUseCase', () => {
  let testingModule: TestingModule;
  let removeLlmKey: RemoveLlmKeyUseCase;
  let keys: LlmKeysRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;
  let authorId: string;

  beforeAll(async () => {
    testingModule = await createLlmKeysTestingModule();
    removeLlmKey = testingModule.get(RemoveLlmKeyUseCase);
    keys = testingModule.get(LlmKeysRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
    authorId = await seedLlmKeyAuthor(testingModule);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('deletes the key', async () => {
    const workspaceId = ids.generate();
    const keyId = await seedLlmKey(testingModule, workspaceId, authorId);

    const removed = await removeLlmKey.execute(llmKeysCtx(authorId, workspaceId), {
      id: publicLlmKeyId(testingModule, keyId),
    });

    expect(removed).toBe(true);
    await expect(
      tenants.run(workspaceId, () => keys.findById(workspaceId, keyId)),
    ).resolves.toBeNull();
  });

  it('refuses a key of another workspace', async () => {
    const owner = ids.generate();
    const keyId = await seedLlmKey(testingModule, owner, authorId);

    await expect(
      removeLlmKey.execute(llmKeysCtx(authorId, ids.generate()), {
        id: publicLlmKeyId(testingModule, keyId),
      }),
    ).rejects.toBeInstanceOf(LlmKeyNotFoundError);
    await expect(tenants.run(owner, () => keys.findById(owner, keyId))).resolves.not.toBeNull();
  });

  it('refuses a builder', async () => {
    const workspaceId = ids.generate();
    const keyId = await seedLlmKey(testingModule, workspaceId, authorId);

    await expect(
      removeLlmKey.execute(llmKeysCtx(authorId, workspaceId, WorkspaceRole.Builder), {
        id: publicLlmKeyId(testingModule, keyId),
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
