import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LlmKeysRepository } from '@/modules/llm-keys/repositories/llm-keys.repository';
import { CleanUpWorkspaceUseCase } from '@/modules/llm-keys/use-cases/clean-up-workspace.use-case';
import { SystemActorRequiredError } from '@/platform/context/errors/system-actor-required.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { systemCtx } from '@test/support/fixtures/identity.fixture';
import {
  createLlmKeysTestingModule,
  llmKeysCtx,
  seedLlmKey,
  seedLlmKeyAuthor,
} from '@test/support/helpers/llm-keys-testing.helpers';

describe('CleanUpWorkspaceUseCase', () => {
  let testingModule: TestingModule;
  let cleanUp: CleanUpWorkspaceUseCase;
  let keys: LlmKeysRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;
  let authorId: string;

  beforeAll(async () => {
    testingModule = await createLlmKeysTestingModule();
    cleanUp = testingModule.get(CleanUpWorkspaceUseCase);
    keys = testingModule.get(LlmKeysRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
    authorId = await seedLlmKeyAuthor(testingModule);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const remainingKeys = (workspaceId: string) =>
    tenants.run(workspaceId, () => keys.listByWorkspace(workspaceId));

  it('deletes the keys of the workspace and keeps the others', async () => {
    const workspaceId = ids.generate();
    const otherWorkspaceId = ids.generate();
    await seedLlmKey(testingModule, workspaceId, authorId);
    await seedLlmKey(testingModule, otherWorkspaceId, authorId);

    await cleanUp.execute(systemCtx(), { workspaceId });

    expect(await remainingKeys(workspaceId)).toEqual([]);
    expect(await remainingKeys(otherWorkspaceId)).toHaveLength(1);
  });

  it('refuses a non-system actor', async () => {
    const workspaceId = ids.generate();

    await expect(
      cleanUp.execute(llmKeysCtx(authorId, workspaceId), { workspaceId }),
    ).rejects.toBeInstanceOf(SystemActorRequiredError);
  });
});
