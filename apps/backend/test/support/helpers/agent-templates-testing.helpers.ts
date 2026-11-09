import { IdPrefix } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { AgentsModule } from '@/modules/agents/agents.module';
import { KnowledgeModule } from '@/modules/knowledge';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { PromptsModule } from '@/modules/prompts';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import type { PromptFolder } from '@/modules/prompts/typedefs/prompt-folder.typedefs';
import type { Prompt } from '@/modules/prompts/typedefs/prompt.typedefs';
import { CacheModule } from '@/platform/cache/cache.module';
import { ClockService } from '@/platform/clock/services/clock.service';
import { CryptoModule } from '@/platform/crypto/crypto.module';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { OutboundHttpModule } from '@/platform/outbound-http/outbound-http.module';
import { QueuesModule } from '@/platform/queues/queues.module';
import { RateLimitModule } from '@/platform/rate-limit/rate-limit.module';
import { RedisModule } from '@/platform/redis/redis.module';
import { SecretsModule } from '@/platform/secrets/secrets.module';
import { FakeFileStorage } from '@/platform/storage/gateways/file-storage.fake';
import { FileStorage } from '@/platform/storage/gateways/file-storage.gateway';
import { StorageModule } from '@/platform/storage/storage.module';
import { AGENTS_TEST_START } from '@test/support/constants/agents-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { newKnowledgeBase } from '@test/support/fixtures/knowledge.fixture';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import { AgentsNeighboursModule } from '@test/support/modules/agents-neighbours.module';

export const createAgentTemplatesTestingModule = (): Promise<TestingModule> =>
  createPlatformTestingModule(
    TestRedisPrefix.Agents,
    [
      RedisModule,
      RateLimitModule,
      OutboundHttpModule,
      StorageModule,
      CacheModule,
      CryptoModule,
      SecretsModule,
      QueuesModule.forRole(Role.Api),
      AgentsNeighboursModule.forRole(Role.Api),
      AgentsModule.forRole(Role.Api),
      PromptsModule.forRole(Role.Api),
      KnowledgeModule.forRole(Role.Api),
    ],
    [
      { token: ClockService, value: new ManualClock(AGENTS_TEST_START) },
      { token: FileStorage, value: new FakeFileStorage() },
    ],
  );

export const seedTemplateKnowledgeBase = async (
  testingModule: TestingModule,
  workspaceId: string,
): Promise<string> => {
  await ensureWorkspaceRow(testingModule, workspaceId);
  const knowledgeBaseId = testingModule.get(IdService).generate();
  await testingModule
    .get(TenantTransactionService)
    .run(workspaceId, () =>
      testingModule
        .get(KnowledgeBasesRepository)
        .insert(newKnowledgeBase(knowledgeBaseId, workspaceId)),
    );
  return knowledgeBaseId;
};

export const listTemplateKnowledgeBases = async (
  testingModule: TestingModule,
  workspaceId: string,
): Promise<readonly { id: string; name: string }[]> => {
  const ids = testingModule.get(IdService);
  const knowledgeBases = await testingModule
    .get(TenantTransactionService)
    .run(workspaceId, () => testingModule.get(KnowledgeBasesRepository).list(workspaceId));
  return knowledgeBases.map((knowledgeBase) => ({
    id: ids.toPublic(IdPrefix.KnowledgeBase, knowledgeBase.id),
    name: knowledgeBase.name,
  }));
};

export const listWorkspacePrompts = (
  testingModule: TestingModule,
  workspaceId: string,
): Promise<Prompt[]> =>
  testingModule
    .get(TenantTransactionService)
    .run(workspaceId, () => testingModule.get(PromptsRepository).list(workspaceId));

export const findPromptFolder = (
  testingModule: TestingModule,
  workspaceId: string,
  name: string,
): Promise<PromptFolder | null> =>
  testingModule
    .get(TenantTransactionService)
    .run(workspaceId, () =>
      testingModule.get(PromptFoldersRepository).findByName(workspaceId, name),
    );
