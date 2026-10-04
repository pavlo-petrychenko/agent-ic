import { describe, expect, it } from 'vitest';
import {
  CliOption,
  EnvVar,
  LangfuseMode,
  NodeEnvironment,
} from '@/platform/config/config.constants';
import { ConfigError } from '@/platform/config/config.error';
import { ConfigLoader } from '@/platform/config/config.loader';
import type { ConfigIssue } from '@/platform/config/config.typedefs';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { createArgv, cliArgument, createTestEnv } from '@test/support/fixtures/test-env.fixture';

const roleArgv = (role: Role): string[] => createArgv(cliArgument(CliOption.Role, role));

const issuesOf = (load: () => unknown): readonly ConfigIssue[] => {
  try {
    load();
  } catch (error) {
    if (error instanceof ConfigError) {
      return error.issues;
    }
    throw error;
  }
  return [];
};

const variablesOf = (issues: readonly ConfigIssue[]): string[] =>
  issues.map((issue) => issue.variable);

describe('ConfigLoader', () => {
  it('reads the api section with the api port', () => {
    const config = new ConfigLoader(createTestEnv({ [EnvVar.ApiPort]: '4100' })).load(
      roleArgv(Role.Api),
    );

    expect(config.role).toBe(Role.Api);
    expect(config.http.port).toBe(4100);
  });

  it('reads the gateway section with the gateway port', () => {
    const config = new ConfigLoader(createTestEnv({ [EnvVar.GatewayPort]: '4200' })).load(
      roleArgv(Role.Gateway),
    );

    expect(config.role).toBe(Role.Gateway);
    expect(config.http.port).toBe(4200);
  });

  it('reads the worker section with its queues from the command line', () => {
    const queues = [QueueName.RunsReactive, QueueName.Timers];
    const config = new ConfigLoader(createTestEnv()).load(
      createArgv(
        cliArgument(CliOption.Role, Role.Worker),
        cliArgument(CliOption.Queues, queues.join(',')),
      ),
    );

    expect(config.role).toBe(Role.Worker);
    expect(config.role === Role.Worker ? config.queues : []).toEqual(queues);
  });

  it('reads the worker concurrency', () => {
    const config = new ConfigLoader(createTestEnv({ [EnvVar.WorkerConcurrency]: '8' })).load(
      createArgv(
        cliArgument(CliOption.Role, Role.Worker),
        cliArgument(CliOption.Queues, QueueName.Ingest),
      ),
    );

    expect(config.role === Role.Worker ? config.worker.concurrency : null).toBe(8);
  });

  it('requires the worker concurrency only for the worker role', () => {
    const env = createTestEnv({ [EnvVar.WorkerConcurrency]: undefined });

    const issues = issuesOf(() =>
      new ConfigLoader(env).load(
        createArgv(
          cliArgument(CliOption.Role, Role.Worker),
          cliArgument(CliOption.Queues, QueueName.Ingest),
        ),
      ),
    );

    expect(variablesOf(issues)).toEqual([EnvVar.WorkerConcurrency]);
    expect(() => new ConfigLoader(env).load(roleArgv(Role.Api))).not.toThrow();
  });

  it('reads the redis urls', () => {
    const env = createTestEnv({
      [EnvVar.RedisQueueUrl]: 'redis://queue:6379',
      [EnvVar.RedisCacheUrl]: 'rediss://cache:6380',
    });

    const config = new ConfigLoader(env).load(roleArgv(Role.Gateway));

    expect(config.redis).toEqual({
      queueUrl: 'redis://queue:6379',
      cacheUrl: 'rediss://cache:6380',
    });
  });

  it('rejects a redis url of another protocol', () => {
    const env = createTestEnv({ [EnvVar.RedisCacheUrl]: 'http://cache:6379' });

    const issues = issuesOf(() => new ConfigLoader(env).load(roleArgv(Role.Api)));

    expect(variablesOf(issues)).toEqual([EnvVar.RedisCacheUrl]);
  });

  it('reads the platform admin dev access for the api', () => {
    const env = createTestEnv({ [EnvVar.PlatformAdminDevAccess]: 'true' });

    const config = new ConfigLoader(env).load(roleArgv(Role.Api));

    expect(config.role === Role.Api ? config.platformAdmin.devAccess : null).toBe(true);
  });

  it('refuses the platform admin dev access in production', () => {
    const env = createTestEnv({
      [EnvVar.NodeEnv]: NodeEnvironment.Production,
      [EnvVar.PlatformAdminDevAccess]: 'true',
    });

    const issues = issuesOf(() => new ConfigLoader(env).load(roleArgv(Role.Api)));

    expect(variablesOf(issues)).toEqual([EnvVar.PlatformAdminDevAccess]);
  });

  it('does not require the ports of other roles', () => {
    const env = createTestEnv({ [EnvVar.GatewayPort]: undefined, [EnvVar.WorkerPort]: undefined });

    expect(() => new ConfigLoader(env).load(roleArgv(Role.Api))).not.toThrow();
  });

  it('rejects a missing role', () => {
    const issues = issuesOf(() => new ConfigLoader(createTestEnv()).load(createArgv()));

    expect(variablesOf(issues)).toEqual([`--${CliOption.Role}`]);
  });

  it('rejects an unknown role', () => {
    const issues = issuesOf(() =>
      new ConfigLoader(createTestEnv()).load(createArgv(cliArgument(CliOption.Role, 'unknown'))),
    );

    expect(variablesOf(issues)).toEqual([`--${CliOption.Role}`]);
  });

  it('rejects a worker without queues', () => {
    const issues = issuesOf(() => new ConfigLoader(createTestEnv()).load(roleArgv(Role.Worker)));

    expect(variablesOf(issues)).toEqual([`--${CliOption.Queues}`]);
  });

  it('rejects an unknown queue', () => {
    const issues = issuesOf(() =>
      new ConfigLoader(createTestEnv()).load(
        createArgv(
          cliArgument(CliOption.Role, Role.Worker),
          cliArgument(CliOption.Queues, 'unknown'),
        ),
      ),
    );

    expect(variablesOf(issues)).toHaveLength(1);
  });

  it('rejects an unknown command line option', () => {
    const issues = issuesOf(() =>
      new ConfigLoader(createTestEnv()).load([...roleArgv(Role.Api), '--unknown=1']),
    );

    expect(issues).toHaveLength(1);
  });

  it('lists every invalid variable at once', () => {
    const env = createTestEnv({
      [EnvVar.ApiPort]: 'not-a-port',
      [EnvVar.LogLevel]: 'loud',
      [EnvVar.OtelServiceName]: undefined,
    });

    const issues = issuesOf(() => new ConfigLoader(env).load(roleArgv(Role.Api)));

    expect(variablesOf(issues).toSorted()).toEqual(
      [EnvVar.ApiPort, EnvVar.LogLevel, EnvVar.OtelServiceName].toSorted(),
    );
  });

  it('puts every invalid variable into the error message', () => {
    const env = createTestEnv({ [EnvVar.ApiPort]: '0' });

    expect(() => new ConfigLoader(env).load(roleArgv(Role.Api))).toThrow(EnvVar.ApiPort);
  });

  it('accepts the disabled Langfuse mode without credentials', () => {
    const env = createTestEnv({
      [EnvVar.LangfuseMode]: LangfuseMode.Off,
      [EnvVar.LangfuseHost]: undefined,
      [EnvVar.LangfusePublicKey]: undefined,
      [EnvVar.LangfuseSecretKey]: undefined,
      [EnvVar.LangfuseSampleRate]: '0.25',
    });

    const config = new ConfigLoader(env).load(roleArgv(Role.Api));

    expect(config.langfuse).toEqual({ mode: LangfuseMode.Off, sampleRate: 0.25 });
  });

  it('requires credentials when Langfuse is on', () => {
    const env = createTestEnv({
      [EnvVar.LangfuseMode]: LangfuseMode.SelfHosted,
      [EnvVar.LangfuseHost]: undefined,
      [EnvVar.LangfusePublicKey]: undefined,
      [EnvVar.LangfuseSecretKey]: undefined,
    });

    const issues = issuesOf(() => new ConfigLoader(env).load(roleArgv(Role.Api)));

    expect(variablesOf(issues).toSorted()).toEqual(
      [EnvVar.LangfuseHost, EnvVar.LangfusePublicKey, EnvVar.LangfuseSecretKey].toSorted(),
    );
  });

  it('reads the Langfuse credentials when it is on', () => {
    const env = createTestEnv({ [EnvVar.LangfuseMode]: LangfuseMode.Cloud });

    const config = new ConfigLoader(env).load(roleArgv(Role.Api));

    expect(config.langfuse.mode).toBe(LangfuseMode.Cloud);
  });

  it('rejects a Langfuse sample rate above one', () => {
    const env = createTestEnv({ [EnvVar.LangfuseSampleRate]: '1.5' });

    const issues = issuesOf(() => new ConfigLoader(env).load(roleArgv(Role.Api)));

    expect(variablesOf(issues)).toEqual([EnvVar.LangfuseSampleRate]);
  });
  it('reads the database section', () => {
    const env = createTestEnv({ [EnvVar.DatabasePoolMax]: '7' });

    const config = new ConfigLoader(env).load(roleArgv(Role.Api));

    expect(config.database).toEqual({
      url: env[EnvVar.DatabaseUrl],
      systemUrl: env[EnvVar.DatabaseSystemUrl],
      poolMax: 7,
    });
  });

  it('rejects a database url that is not postgres', () => {
    const env = createTestEnv({ [EnvVar.DatabaseUrl]: 'mysql://app:app@localhost/agent_ic' });

    const issues = issuesOf(() => new ConfigLoader(env).load(roleArgv(Role.Api)));

    expect(variablesOf(issues)).toEqual([EnvVar.DatabaseUrl]);
  });

  it('reads the migration config without role variables', () => {
    const env = createTestEnv({ [EnvVar.ApiPort]: undefined, [EnvVar.DatabaseUrl]: undefined });

    const config = new ConfigLoader(env).loadMigration();

    expect(config.ownerUrl).toBe(env[EnvVar.DatabaseOwnerUrl]);
  });

  it('requires the owner url for migrations', () => {
    const env = createTestEnv({ [EnvVar.DatabaseOwnerUrl]: undefined });

    const issues = issuesOf(() => new ConfigLoader(env).loadMigration());

    expect(variablesOf(issues)).toEqual([EnvVar.DatabaseOwnerUrl]);
  });
});
