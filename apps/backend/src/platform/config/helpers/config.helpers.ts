import { ConfigError } from '@/platform/config/errors/config.error';
import { toConfigIssues } from '@/platform/config/helpers/config-issue.helpers';
import { authEnvSchema } from '@/platform/config/schemas/auth-env.schema';
import { commonEnvSchema } from '@/platform/config/schemas/common-env.schema';
import { emailEnvSchema } from '@/platform/config/schemas/email-env.schema';
import { googleEnvSchema } from '@/platform/config/schemas/google-env.schema';
import { langfuseEnvSchema } from '@/platform/config/schemas/langfuse-env.schema';
import { llmEnvSchema } from '@/platform/config/schemas/llm-env.schema';
import { migrationEnvSchema } from '@/platform/config/schemas/migration-env.schema';
import { roleEnvSchemas } from '@/platform/config/schemas/role-env.schema';
import { secretsEnvSchema } from '@/platform/config/schemas/secrets-env.schema';
import { storageEnvSchema } from '@/platform/config/schemas/storage-env.schema';
import { usageEnvSchema } from '@/platform/config/schemas/usage-env.schema';
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
  const storage = storageEnvSchema.safeParse(env);
  const auth = authEnvSchema.safeParse(env);
  const secretBox = secretsEnvSchema.safeParse(env);
  const llm = llmEnvSchema.safeParse(env);
  const usage = usageEnvSchema.safeParse(env);
  const email = emailEnvSchema.safeParse(env);
  const google = googleEnvSchema.safeParse(env);
  const roleEnvironment = roleEnvSchemas[selection.role].safeParse(env);

  if (
    !common.success ||
    !langfuse.success ||
    !storage.success ||
    !auth.success ||
    !secretBox.success ||
    !llm.success ||
    !usage.success ||
    !email.success ||
    !google.success ||
    !roleEnvironment.success
  ) {
    const results = [
      common,
      langfuse,
      storage,
      auth,
      secretBox,
      llm,
      usage,
      email,
      google,
      roleEnvironment,
    ];
    throw new ConfigError(
      results.flatMap((result) => (result.success ? [] : toConfigIssues(result.error))),
    );
  }

  const environment = roleEnvironment.data;
  const base: BaseConfig = {
    nodeEnv: common.data.nodeEnv,
    version: common.data.version,
    logLevel: common.data.logLevel,
    publicUrl: common.data.publicUrl,
    http: { host: common.data.host, port: environment.port },
    database: common.data.database,
    redis: common.data.redis,
    storage: storage.data,
    telemetry: common.data.telemetry,
    langfuse: langfuse.data,
    auth: auth.data,
    secretBox: secretBox.data,
    llm: llm.data,
    usage: usage.data,
    email: email.data,
    telegram: common.data.telegram,
    google: google.data,
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
