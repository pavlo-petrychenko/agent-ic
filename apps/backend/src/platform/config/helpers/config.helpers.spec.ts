import { describe, expect, it } from 'vitest';
import { EmailMode } from '@/platform/config/constants/email.constants';
import { EnvVar, NodeEnvironment } from '@/platform/config/constants/env.constants';
import { LangfuseMode } from '@/platform/config/constants/langfuse.constants';
import { loadAppConfig, loadMigrationConfig } from '@/platform/config/helpers/config.helpers';
import type { RoleSelection } from '@/platform/config/typedefs/app-config.typedefs';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { createTestEnv } from '@test/support/fixtures/test-env.fixture';
import { issuesOf, variablesOf } from '@test/support/helpers/config-issue.helpers';

const roleOf = (role: Role): RoleSelection => ({ role, queues: [] });

const WORKER: RoleSelection = { role: Role.Worker, queues: [QueueName.Ingest] };

describe('loadAppConfig', () => {
  it('reads the api section with the api port', () => {
    const config = loadAppConfig(roleOf(Role.Api), createTestEnv({ [EnvVar.ApiPort]: '4100' }));

    expect(config.role).toBe(Role.Api);
    expect(config.http.port).toBe(4100);
  });

  it('reads the gateway section with the gateway port', () => {
    const config = loadAppConfig(
      roleOf(Role.Gateway),
      createTestEnv({ [EnvVar.GatewayPort]: '4200' }),
    );

    expect(config.role).toBe(Role.Gateway);
    expect(config.http.port).toBe(4200);
  });

  it('keeps the queues of the worker role', () => {
    const queues = [QueueName.RunsReactive, QueueName.Timers];
    const config = loadAppConfig({ role: Role.Worker, queues }, createTestEnv());

    expect(config.role).toBe(Role.Worker);
    expect(config.role === Role.Worker ? config.queues : []).toEqual(queues);
  });

  it('reads the worker concurrency', () => {
    const config = loadAppConfig(WORKER, createTestEnv({ [EnvVar.WorkerConcurrency]: '8' }));

    expect(config.role === Role.Worker ? config.worker.concurrency : null).toBe(8);
  });

  it('requires the worker concurrency only for the worker role', () => {
    const env = createTestEnv({ [EnvVar.WorkerConcurrency]: undefined });

    const issues = issuesOf(() => loadAppConfig(WORKER, env));

    expect(variablesOf(issues)).toEqual([EnvVar.WorkerConcurrency]);
    expect(() => loadAppConfig(roleOf(Role.Api), env)).not.toThrow();
  });

  it('reads the redis urls', () => {
    const env = createTestEnv({
      [EnvVar.RedisQueueUrl]: 'redis://queue:6379',
      [EnvVar.RedisCacheUrl]: 'rediss://cache:6380',
    });

    const config = loadAppConfig(roleOf(Role.Gateway), env);

    expect(config.redis).toEqual({
      queueUrl: 'redis://queue:6379',
      cacheUrl: 'rediss://cache:6380',
    });
  });

  it('rejects a redis url of another protocol', () => {
    const env = createTestEnv({ [EnvVar.RedisCacheUrl]: 'http://cache:6379' });

    const issues = issuesOf(() => loadAppConfig(roleOf(Role.Api), env));

    expect(variablesOf(issues)).toEqual([EnvVar.RedisCacheUrl]);
  });

  it('reads the platform admin dev access for the api', () => {
    const env = createTestEnv({ [EnvVar.PlatformAdminDevAccess]: 'true' });

    const config = loadAppConfig(roleOf(Role.Api), env);

    expect(config.role === Role.Api ? config.platformAdmin.devAccess : null).toBe(true);
  });

  it('refuses the platform admin dev access in production', () => {
    const env = createTestEnv({
      [EnvVar.NodeEnv]: NodeEnvironment.Production,
      [EnvVar.PlatformAdminDevAccess]: 'true',
    });

    const issues = issuesOf(() => loadAppConfig(roleOf(Role.Api), env));

    expect(variablesOf(issues)).toEqual([EnvVar.PlatformAdminDevAccess]);
  });

  it('does not require the ports of other roles', () => {
    const env = createTestEnv({ [EnvVar.GatewayPort]: undefined, [EnvVar.WorkerPort]: undefined });

    expect(() => loadAppConfig(roleOf(Role.Api), env)).not.toThrow();
  });

  it('lists every invalid variable at once', () => {
    const env = createTestEnv({
      [EnvVar.ApiPort]: 'not-a-port',
      [EnvVar.LogLevel]: 'loud',
      [EnvVar.OtelServiceName]: undefined,
    });

    const issues = issuesOf(() => loadAppConfig(roleOf(Role.Api), env));

    expect(variablesOf(issues).toSorted()).toEqual(
      [EnvVar.ApiPort, EnvVar.LogLevel, EnvVar.OtelServiceName].toSorted(),
    );
  });

  it('puts every invalid variable into the error message', () => {
    const env = createTestEnv({ [EnvVar.ApiPort]: '0' });

    expect(() => loadAppConfig(roleOf(Role.Api), env)).toThrow(EnvVar.ApiPort);
  });

  it('accepts the disabled Langfuse mode without credentials', () => {
    const env = createTestEnv({
      [EnvVar.LangfuseMode]: LangfuseMode.Off,
      [EnvVar.LangfuseHost]: undefined,
      [EnvVar.LangfusePublicKey]: undefined,
      [EnvVar.LangfuseSecretKey]: undefined,
      [EnvVar.LangfuseSampleRate]: '0.25',
    });

    const config = loadAppConfig(roleOf(Role.Api), env);

    expect(config.langfuse).toEqual({ mode: LangfuseMode.Off, sampleRate: 0.25 });
  });

  it('requires credentials when Langfuse is on', () => {
    const env = createTestEnv({
      [EnvVar.LangfuseMode]: LangfuseMode.SelfHosted,
      [EnvVar.LangfuseHost]: undefined,
      [EnvVar.LangfusePublicKey]: undefined,
      [EnvVar.LangfuseSecretKey]: undefined,
    });

    const issues = issuesOf(() => loadAppConfig(roleOf(Role.Api), env));

    expect(variablesOf(issues).toSorted()).toEqual(
      [EnvVar.LangfuseHost, EnvVar.LangfusePublicKey, EnvVar.LangfuseSecretKey].toSorted(),
    );
  });

  it('reads the Langfuse credentials when it is on', () => {
    const env = createTestEnv({ [EnvVar.LangfuseMode]: LangfuseMode.Cloud });

    const config = loadAppConfig(roleOf(Role.Api), env);

    expect(config.langfuse.mode).toBe(LangfuseMode.Cloud);
  });

  it('rejects a Langfuse sample rate above one', () => {
    const env = createTestEnv({ [EnvVar.LangfuseSampleRate]: '1.5' });

    const issues = issuesOf(() => loadAppConfig(roleOf(Role.Api), env));

    expect(variablesOf(issues)).toEqual([EnvVar.LangfuseSampleRate]);
  });

  it('reads the database section', () => {
    const env = createTestEnv({ [EnvVar.DatabasePoolMax]: '7' });

    const config = loadAppConfig(roleOf(Role.Api), env);

    expect(config.database).toEqual({
      url: env[EnvVar.DatabaseUrl],
      systemUrl: env[EnvVar.DatabaseSystemUrl],
      poolMax: 7,
    });
  });

  it('rejects a database url that is not postgres', () => {
    const env = createTestEnv({ [EnvVar.DatabaseUrl]: 'mysql://app:app@localhost/agent_ic' });

    const issues = issuesOf(() => loadAppConfig(roleOf(Role.Api), env));

    expect(variablesOf(issues)).toEqual([EnvVar.DatabaseUrl]);
  });

  it('reads the public url and the access token secret', () => {
    const env = createTestEnv();

    const config = loadAppConfig(roleOf(Role.Worker), env);

    expect(config.publicUrl).toBe(env[EnvVar.PublicUrl]);
    expect(config.auth).toEqual({ accessTokenSecret: env[EnvVar.JwtAccessSecret] });
  });

  it('rejects an access token secret shorter than 32 characters', () => {
    const env = createTestEnv({ [EnvVar.JwtAccessSecret]: 'short-secret' });

    const issues = issuesOf(() => loadAppConfig(roleOf(Role.Api), env));

    expect(variablesOf(issues)).toEqual([EnvVar.JwtAccessSecret]);
  });

  it('reads the SMTP settings in smtp mode', () => {
    const env = createTestEnv({ [EnvVar.EmailMode]: EmailMode.Smtp, [EnvVar.SmtpPort]: '2525' });

    const config = loadAppConfig(roleOf(Role.Worker), env);

    expect(config.email).toEqual({
      mode: EmailMode.Smtp,
      from: env[EnvVar.EmailFrom],
      smtp: { host: env[EnvVar.SmtpHost], port: 2525 },
    });
  });

  it('needs only the Resend key in resend mode', () => {
    const env = createTestEnv({
      [EnvVar.EmailMode]: EmailMode.Resend,
      [EnvVar.SmtpHost]: undefined,
      [EnvVar.SmtpPort]: undefined,
    });

    const config = loadAppConfig(roleOf(Role.Worker), env);

    expect(config.email).toEqual({
      mode: EmailMode.Resend,
      from: env[EnvVar.EmailFrom],
      resend: { apiKey: env[EnvVar.ResendApiKey] },
    });
  });

  it('requires the Resend key in resend mode', () => {
    const env = createTestEnv({
      [EnvVar.EmailMode]: EmailMode.Resend,
      [EnvVar.ResendApiKey]: undefined,
    });

    const issues = issuesOf(() => loadAppConfig(roleOf(Role.Api), env));

    expect(variablesOf(issues)).toEqual([EnvVar.ResendApiKey]);
  });
});

describe('loadMigrationConfig', () => {
  it('reads the migration config without role variables', () => {
    const env = createTestEnv({ [EnvVar.ApiPort]: undefined, [EnvVar.DatabaseUrl]: undefined });

    const config = loadMigrationConfig(env);

    expect(config.ownerUrl).toBe(env[EnvVar.DatabaseOwnerUrl]);
  });

  it('requires the owner url for migrations', () => {
    const env = createTestEnv({ [EnvVar.DatabaseOwnerUrl]: undefined });

    const issues = issuesOf(() => loadMigrationConfig(env));

    expect(variablesOf(issues)).toEqual([EnvVar.DatabaseOwnerUrl]);
  });
});
