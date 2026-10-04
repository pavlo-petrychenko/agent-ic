import { CLI_ARGUMENTS_LABEL, Role } from './config.constants';
import { ConfigError } from './config.error';
import {
  readCliOptions,
  readSchemaPrintOptions,
  toCliIssues,
  toConfigIssues,
} from './config.helpers';
import {
  cliSchema,
  commonEnvSchema,
  langfuseEnvSchema,
  migrationEnvSchema,
  roleEnvSchemas,
  schemaPrintCliSchema,
} from './config.schema';
import type {
  AppConfig,
  BaseConfig,
  CliArguments,
  MigrationConfig,
  RawCliOptions,
  RawSchemaPrintOptions,
  SchemaPrintConfig,
} from './config.typedefs';

export class ConfigLoader {
  constructor(private readonly env: NodeJS.ProcessEnv = process.env) {}

  load(argv: readonly string[]): AppConfig {
    const cli = this.loadCliArguments(argv);
    const common = commonEnvSchema.safeParse(this.env);
    const langfuse = langfuseEnvSchema.safeParse(this.env);
    const roleEnvironment = roleEnvSchemas[cli.role].safeParse(this.env);

    if (!common.success || !langfuse.success || !roleEnvironment.success) {
      const results = [common, langfuse, roleEnvironment];
      throw new ConfigError(
        results.flatMap((result) => (result.success ? [] : toConfigIssues(result.error))),
      );
    }

    const base: BaseConfig = {
      nodeEnv: common.data.nodeEnv,
      version: common.data.version,
      logLevel: common.data.logLevel,
      http: { host: common.data.host, port: roleEnvironment.data.port },
      database: common.data.database,
      telemetry: common.data.telemetry,
      langfuse: langfuse.data,
    };

    switch (cli.role) {
      case Role.Api:
        return { ...base, role: Role.Api };
      case Role.Gateway:
        return { ...base, role: Role.Gateway };
      case Role.Worker:
        return { ...base, role: Role.Worker, queues: cli.queues };
    }
  }

  loadMigration(): MigrationConfig {
    const migration = migrationEnvSchema.safeParse(this.env);
    if (!migration.success) {
      throw new ConfigError(toConfigIssues(migration.error));
    }
    return migration.data;
  }

  loadSchemaPrint(argv: readonly string[]): SchemaPrintConfig {
    const parsed = schemaPrintCliSchema.safeParse(
      this.parseArguments(() => readSchemaPrintOptions(argv)),
    );
    if (!parsed.success) {
      throw new ConfigError(toCliIssues(parsed.error));
    }
    return parsed.data;
  }

  private loadCliArguments(argv: readonly string[]): CliArguments {
    const parsed = cliSchema.safeParse(this.parseArguments(() => readCliOptions(argv)));
    if (!parsed.success) {
      throw new ConfigError(toCliIssues(parsed.error));
    }
    return parsed.data;
  }

  private parseArguments<TOptions extends RawCliOptions | RawSchemaPrintOptions>(
    read: () => TOptions,
  ): TOptions {
    try {
      return read();
    } catch (error) {
      if (error instanceof TypeError) {
        throw new ConfigError([{ variable: CLI_ARGUMENTS_LABEL, message: error.message }]);
      }
      throw error;
    }
  }
}
