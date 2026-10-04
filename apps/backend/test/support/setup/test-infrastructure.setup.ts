import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';
import type { TestProject } from 'vitest/node';
import { DatabaseRole } from '@/platform/database/constants/database.constants';
import { runMigrations } from '@/platform/database/helpers/migration.helpers';
import {
  POSTGRES_IMAGE,
  REDIS_IMAGE,
  ROLES_INIT_SCRIPT,
  ROLES_INIT_TARGET,
  RolesInitEnvVar,
  TEST_DATABASE_NAME,
  TEST_INFRASTRUCTURE_KEY,
  TEST_LANGFUSE_PASSWORD,
  TEST_ROLE_PASSWORDS,
  TEST_SUPERUSER,
  TEST_SUPERUSER_PASSWORD,
} from '@test/support/constants/test-infrastructure.constants';
import {
  describeInfrastructure,
  discardNotice,
} from '@test/support/helpers/test-infrastructure.helpers';

const startPostgres = (): Promise<StartedPostgreSqlContainer> =>
  new PostgreSqlContainer(POSTGRES_IMAGE)
    .withUsername(TEST_SUPERUSER)
    .withPassword(TEST_SUPERUSER_PASSWORD)
    .withEnvironment({
      [RolesInitEnvVar.Database]: TEST_DATABASE_NAME,
      [RolesInitEnvVar.OwnerPassword]: TEST_ROLE_PASSWORDS[DatabaseRole.Owner],
      [RolesInitEnvVar.AppPassword]: TEST_ROLE_PASSWORDS[DatabaseRole.App],
      [RolesInitEnvVar.SystemPassword]: TEST_ROLE_PASSWORDS[DatabaseRole.System],
      [RolesInitEnvVar.LangfusePassword]: TEST_LANGFUSE_PASSWORD,
    })
    .withCopyFilesToContainer([{ source: ROLES_INIT_SCRIPT, target: ROLES_INIT_TARGET }])
    .start();

export const setup = async (project: TestProject): Promise<() => Promise<void>> => {
  const [postgres, redis] = await Promise.all([
    startPostgres(),
    new RedisContainer(REDIS_IMAGE).start(),
  ]);
  const infrastructure = describeInfrastructure(postgres, redis);
  await runMigrations(infrastructure.ownerUrl, discardNotice);
  project.provide(TEST_INFRASTRUCTURE_KEY, infrastructure);
  return async () => {
    await Promise.all([postgres.stop(), redis.stop()]);
  };
};
