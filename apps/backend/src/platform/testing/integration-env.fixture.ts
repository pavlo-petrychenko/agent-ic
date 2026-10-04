import { inject } from 'vitest';
import { EnvVar } from '@/platform/config/config.constants';
import { createTestEnv } from '@/platform/testing/test-env.fixture';
import {
  TEST_INFRASTRUCTURE_KEY,
  TEST_POOL_SIZE,
} from '@/platform/testing/test-infrastructure.constants';
import type { TestRedisDatabase } from '@/platform/testing/test-infrastructure.constants';
import { redisDatabaseUrl } from '@/platform/testing/test-infrastructure.helpers';

export const createIntegrationTestEnv = (
  redisDatabase: TestRedisDatabase,
  overrides: Partial<Record<EnvVar, string | undefined>> = {},
): NodeJS.ProcessEnv => {
  const infrastructure = inject(TEST_INFRASTRUCTURE_KEY);
  const redisUrl = redisDatabaseUrl(infrastructure.redisUrl, redisDatabase);
  return createTestEnv({
    [EnvVar.DatabaseUrl]: infrastructure.appUrl,
    [EnvVar.DatabaseSystemUrl]: infrastructure.systemUrl,
    [EnvVar.DatabaseOwnerUrl]: infrastructure.ownerUrl,
    [EnvVar.DatabasePoolMax]: TEST_POOL_SIZE,
    [EnvVar.RedisQueueUrl]: redisUrl,
    [EnvVar.RedisCacheUrl]: redisUrl,
    ...overrides,
  });
};
