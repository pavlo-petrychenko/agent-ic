import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { StartedRedisContainer } from '@testcontainers/redis';
import { DatabaseRole } from '@/platform/database/constants/database.constants';
import {
  DATABASE_URL_PROTOCOL,
  TEST_DATABASE_NAME,
  TEST_ROLE_PASSWORDS,
  TEST_SUPERUSER,
  TEST_SUPERUSER_PASSWORD,
  URL_PATH_SEPARATOR,
} from '@test/support/constants/test-infrastructure.constants';
import type { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
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

export const redisDatabaseUrl = (url: string, database: TestRedisDatabase): string => {
  const redisUrl = new URL(url);
  redisUrl.pathname = `${URL_PATH_SEPARATOR}${database}`;
  return redisUrl.toString();
};

export const discardNotice = (): void => undefined;
