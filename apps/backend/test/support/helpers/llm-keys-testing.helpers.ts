import { IdPrefix, Locale, WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { UsersRepository } from '@/modules/identity';
import { LlmKeysModule } from '@/modules/llm-keys';
import { LlmKeysRepository } from '@/modules/llm-keys/repositories/llm-keys.repository';
import type { NewLlmKey } from '@/modules/llm-keys/typedefs/llm-key.typedefs';
import { CacheModule } from '@/platform/cache/cache.module';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { FakeLlmModelListGateway } from '@/platform/llm/gateways/llm-model-list.fake';
import { LlmModelListGateway } from '@/platform/llm/gateways/llm-model-list.gateway';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { OutboundHttpModule } from '@/platform/outbound-http/outbound-http.module';
import { RateLimitModule } from '@/platform/rate-limit/rate-limit.module';
import { RedisModule } from '@/platform/redis/redis.module';
import { SecretsModule } from '@/platform/secrets/secrets.module';
import { SecretBoxService } from '@/platform/secrets/services/secret-box.service';
import {
  LLM_KEYS_TEST_START,
  TEST_LLM_API_KEY,
  TEST_LLM_KEY_AUTHOR_NAME,
  TEST_LLM_KEY_AUTHOR_PASSWORD_HASH,
} from '@test/support/constants/llm-keys-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { uniqueEmail } from '@test/support/fixtures/identity.fixture';
import { newLlmKey } from '@test/support/fixtures/llm-keys.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import { LlmKeysNeighboursModule } from '@test/support/modules/llm-keys-neighbours.module';
import { UsageSeamsFakeModule } from '@test/support/modules/usage-seams-fake.module';

export const createLlmKeysTestingModule = (): Promise<TestingModule> => {
  const models = new FakeLlmModelListGateway();
  return createPlatformTestingModule(
    TestRedisPrefix.LlmKeys,
    [
      RedisModule,
      RateLimitModule,
      CacheModule,
      SecretsModule,
      OutboundHttpModule,
      LlmKeysModule.forRole(Role.Api),
      LlmKeysNeighboursModule.forRole(Role.Api),
    ],
    [
      { token: LlmModelListGateway, value: models },
      { token: FakeLlmModelListGateway, value: models },
    ],
    [UsageSeamsFakeModule],
  );
};

export const seedLlmKeyAuthor = async (testingModule: TestingModule): Promise<string> => {
  const userId = testingModule.get(IdService).generate();
  await testingModule.get(UsersRepository).upsertUnconfirmed({
    id: userId,
    email: uniqueEmail(),
    name: TEST_LLM_KEY_AUTHOR_NAME,
    passwordHash: TEST_LLM_KEY_AUTHOR_PASSWORD_HASH,
    locale: Locale.En,
    createdAt: LLM_KEYS_TEST_START,
    updatedAt: LLM_KEYS_TEST_START,
  });
  return userId;
};

export const llmKeysCtx = (
  userId: string,
  workspaceId: string,
  role: WorkspaceRole = WorkspaceRole.Owner,
): UseCaseCtx => workspaceCtx(userId, workspaceId, role);

export const seedLlmKey = async (
  testingModule: TestingModule,
  workspaceId: string,
  createdBy: string,
  overrides: Partial<NewLlmKey> = {},
): Promise<string> => {
  await ensureWorkspaceRow(testingModule, workspaceId);
  const keyId = testingModule.get(IdService).generate();
  const sealedKey = testingModule.get(SecretBoxService).seal(TEST_LLM_API_KEY);
  await testingModule
    .get(TenantTransactionService)
    .run(workspaceId, () =>
      testingModule
        .get(LlmKeysRepository)
        .insert(newLlmKey(keyId, workspaceId, createdBy, { sealedKey, ...overrides })),
    );
  return keyId;
};

export const publicLlmKeyId = (testingModule: TestingModule, keyId: string): string =>
  testingModule.get(IdService).toPublic(IdPrefix.LlmKey, keyId);
