import { Locale } from '@agent-ic/contracts';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { StartedRedisContainer } from '@testcontainers/redis';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { users } from '@/modules/identity/db/users.table';
import type { AppConfig } from '@/platform/config/typedefs/app-config.typedefs';
import { DatabaseRole } from '@/platform/database/constants/database.constants';
import { createSqlClient } from '@/platform/database/helpers/sql-client.helpers';
import type { DatabaseClientListeners } from '@/platform/database/typedefs/database-client.typedefs';
import { URL_PATH_SEPARATOR } from '@/platform/http/constants/url.constants';
import {
  AGENTS_TEST_START,
  TEST_AUTHOR_PASSWORD_HASH,
  TEST_EDITOR_EMAIL,
  TEST_EDITOR_ID,
  TEST_EDITOR_NAME,
} from '@test/support/constants/agents-testing.constants';
import {
  DATABASE_URL_PROTOCOL,
  SCRATCH_POOL_SIZE,
  TEST_APPLICATION_NAME,
  TEST_DATABASE_NAME,
  TEST_ROLE_PASSWORDS,
  TEST_SUPERUSER,
  TEST_SUPERUSER_PASSWORD,
} from '@test/support/constants/test-infrastructure.constants';
import type { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import type {
  DatabaseUrlParts,
  TestInfrastructure,
} from '@test/support/typedefs/test-infrastructure.typedefs';

export const buildDatabaseUrl = (parts: DatabaseUrlParts): string => {
  const url = new URL(`${DATABASE_URL_PROTOCOL}${URL_PATH_SEPARATOR}${URL_PATH_SEPARATOR}`);
  url.hostname = parts.host;
  url.port = String(parts.port);
  url.username = parts.user;
  url.password = parts.password;
  url.pathname = `${URL_PATH_SEPARATOR}${parts.database}`;
  return url.toString();
};

export const describeInfrastructure = (
  postgres: StartedPostgreSqlContainer,
  redis: StartedRedisContainer,
): TestInfrastructure => {
  const roleUrl = (role: DatabaseRole): string =>
    buildDatabaseUrl({
      user: role,
      password: TEST_ROLE_PASSWORDS[role],
      host: postgres.getHost(),
      port: postgres.getPort(),
      database: TEST_DATABASE_NAME,
    });
  return {
    superuserUrl: buildDatabaseUrl({
      user: TEST_SUPERUSER,
      password: TEST_SUPERUSER_PASSWORD,
      host: postgres.getHost(),
      port: postgres.getPort(),
      database: TEST_DATABASE_NAME,
    }),
    ownerUrl: roleUrl(DatabaseRole.Owner),
    appUrl: roleUrl(DatabaseRole.App),
    systemUrl: roleUrl(DatabaseRole.System),
    redisUrl: redis.getConnectionUrl(),
  };
};

export const withTestRedisPrefix = <TConfig extends AppConfig>(
  config: TConfig,
  keyPrefix: TestRedisPrefix,
): TConfig => ({
  ...config,
  redis: { ...config.redis, keyPrefix },
});

const discardNotice = (): void => undefined;

const failOnIdleError = (error: Error): never => {
  throw error;
};

export const testDatabaseListeners = (): DatabaseClientListeners => ({
  onNotice: discardNotice,
  onIdleError: failOnIdleError,
});

export const createTestSqlClient = (url: string, poolMax: number): Pool =>
  createSqlClient(
    { url, poolMax, applicationName: TEST_APPLICATION_NAME },
    testDatabaseListeners(),
  );

export const seedSharedTestUsers = async (ownerUrl: string): Promise<void> => {
  const client = createTestSqlClient(ownerUrl, SCRATCH_POOL_SIZE);
  try {
    await drizzle({ client })
      .insert(users)
      .values({
        id: TEST_EDITOR_ID,
        email: TEST_EDITOR_EMAIL,
        name: TEST_EDITOR_NAME,
        passwordHash: TEST_AUTHOR_PASSWORD_HASH,
        locale: Locale.En,
        createdAt: AGENTS_TEST_START,
        updatedAt: AGENTS_TEST_START,
      })
      .onConflictDoNothing();
  } finally {
    await client.end();
  }
};
