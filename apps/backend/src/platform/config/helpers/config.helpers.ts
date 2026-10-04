import { ConfigError } from '@/platform/config/errors/config.error';
import { toConfigIssues } from '@/platform/config/helpers/config-issue.helpers';
import { commonEnvSchema } from '@/platform/config/schemas/common-env.schema';
import { langfuseEnvSchema } from '@/platform/config/schemas/langfuse-env.schema';
import { migrationEnvSchema } from '@/platform/config/schemas/migration-env.schema';
import { roleEnvSchemas } from '@/platform/config/schemas/role-env.schema';
import type {
  AppConfig,
  BaseConfig,
  RoleSelection,
} from '@/platform/config/typedefs/app-config.typedefs';
import type { MigrationConfig } from '@/platform/config/typedefs/migration-config.typedefs';
import { Role } from '@/platform/module-roles/constants/role.constants';

export const loadAppConfig = (
  selection: RoleSelection,
  env: NodeJS.ProcessEnv = process.env,
): AppConfig => {
  const common = commonEnvSchema.safeParse(env);
  const langfuse = langfuseEnvSchema.safeParse(env);
  const roleEnvironment = roleEnvSchemas[selection.role].safeParse(env);

  if (!common.success || !langfuse.success || !roleEnvironment.success) {
    const results = [common, langfuse, roleEnvironment];
    throw new ConfigError(
      results.flatMap((result) => (result.success ? [] : toConfigIssues(result.error))),
    );
  }

  const environment = roleEnvironment.data;
  const base: BaseConfig = {
    nodeEnv: common.data.nodeEnv,
    version: common.data.version,
    logLevel: common.data.logLevel,
    http: { host: common.data.host, port: environment.port },
    database: common.data.database,
    redis: common.data.redis,
    telemetry: common.data.telemetry,
    langfuse: langfuse.data,
  };

  switch (environment.role) {
    case Role.Api:
      return { ...base, role: Role.Api, platformAdmin: environment.platformAdmin };
    case Role.Gateway:
      return { ...base, role: Role.Gateway };
    case Role.Worker:
      return { ...base, role: Role.Worker, queues: selection.queues, worker: environment.worker };
  }
};

export const loadMigrationConfig = (env: NodeJS.ProcessEnv = process.env): MigrationConfig => {
  const migration = migrationEnvSchema.safeParse(env);
  if (!migration.success) {
    throw new ConfigError(toConfigIssues(migration.error));
  }
  return migration.data;
};
