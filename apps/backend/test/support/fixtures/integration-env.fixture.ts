import { inject } from 'vitest';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import type { AppConfig, RoleSelection } from '@/platform/config/typedefs/app-config.typedefs';
import {
  TEST_INFRASTRUCTURE_KEY,
  TEST_POOL_SIZE,
} from '@test/support/constants/test-infrastructure.constants';
import type { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { createTestEnv } from '@test/support/fixtures/test-env.fixture';
import { withTestRedisPrefix } from '@test/support/helpers/test-infrastructure.helpers';

export const createIntegrationTestEnv = (
  overrides: Partial<Record<EnvVar, string | undefined>> = {},
): NodeJS.ProcessEnv => {
  const infrastructure = inject(TEST_INFRASTRUCTURE_KEY);
  return createTestEnv({
    [EnvVar.DatabaseUrl]: infrastructure.appUrl,
    [EnvVar.DatabaseSystemUrl]: infrastructure.systemUrl,
    [EnvVar.DatabaseOwnerUrl]: infrastructure.ownerUrl,
    [EnvVar.DatabasePoolMax]: TEST_POOL_SIZE,
    [EnvVar.RedisQueueUrl]: infrastructure.redisUrl,
    [EnvVar.RedisCacheUrl]: infrastructure.redisUrl,
    ...overrides,
  });
};

export const createIntegrationConfig = (
  selection: RoleSelection,
  redisPrefix: TestRedisPrefix,
  overrides: Partial<Record<EnvVar, string | undefined>> = {},
): AppConfig =>
  withTestRedisPrefix(loadAppConfig(selection, createIntegrationTestEnv(overrides)), redisPrefix);
