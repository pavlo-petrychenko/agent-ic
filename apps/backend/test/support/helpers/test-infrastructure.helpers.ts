import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { StartedRedisContainer } from '@testcontainers/redis';
import type { AppConfig } from '@/platform/config/typedefs/app-config.typedefs';
import { DatabaseRole } from '@/platform/database/constants/database.constants';
import { URL_PATH_SEPARATOR } from '@/platform/http/constants/url.constants';
import {
  DATABASE_URL_PROTOCOL,
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

export const discardNotice = (): void => undefined;
