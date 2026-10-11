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

const OLD_KEY = 'a'.repeat(64);

const OTHER_KEY = 'B'.repeat(64);

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

  it('reads the redis urls and keeps the key prefix empty', () => {
    const env = createTestEnv({
      [EnvVar.RedisQueueUrl]: 'redis://queue:6379',
      [EnvVar.RedisCacheUrl]: 'rediss://cache:6380',
    });

    const config = loadAppConfig(roleOf(Role.Gateway), env);

    expect(config.redis).toEqual({
      queueUrl: 'redis://queue:6379',
      cacheUrl: 'rediss://cache:6380',
      keyPrefix: '',
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
    expect(config.auth).toEqual({
      accessTokenSecret: env[EnvVar.JwtAccessSecret],
      inviteTokenSecret: env[EnvVar.InviteTokenSecret],
    });
  });

  it('rejects an access token secret shorter than 32 characters', () => {
    const env = createTestEnv({ [EnvVar.JwtAccessSecret]: 'short-secret' });

    const issues = issuesOf(() => loadAppConfig(roleOf(Role.Api), env));

    expect(variablesOf(issues)).toEqual([EnvVar.JwtAccessSecret]);
  });

  it.each([
    { [EnvVar.InviteTokenSecret]: undefined },
    { [EnvVar.InviteTokenSecret]: 'short-secret' },
  ])('requires an invite token secret of at least 32 characters', (override) => {
    const issues = issuesOf(() => loadAppConfig(roleOf(Role.Api), createTestEnv(override)));

    expect(variablesOf(issues)).toEqual([EnvVar.InviteTokenSecret]);
  });

  it('reads the secret box key, its version and no previous keys by default', () => {
    const env = createTestEnv({ [EnvVar.SecretBoxKeyVersion]: '3' });

    const config = loadAppConfig(roleOf(Role.Api), env);

    expect(config.secretBox).toEqual({
      current: { version: 3, key: env[EnvVar.SecretBoxKey] },
      previous: [],
    });
  });

  it('reads the previous secret box keys as version and key pairs', () => {
    const env = createTestEnv({
      [EnvVar.SecretBoxKeyVersion]: '3',
      [EnvVar.SecretBoxPreviousKeys]: `1:${OLD_KEY}, 2:${OTHER_KEY}`,
    });

    const config = loadAppConfig(roleOf(Role.Worker), env);

    expect(config.secretBox.previous).toEqual([
      { version: 1, key: OLD_KEY },
      { version: 2, key: OTHER_KEY },
    ]);
  });

  it.each([undefined, '', OLD_KEY.slice(2), `${OLD_KEY}00`, OLD_KEY.replace('a', 'g')])(
    'stops boot on a secret box key that is not 32 bytes of hex: %s',
    (key) => {
      const env = createTestEnv({ [EnvVar.SecretBoxKey]: key });

      const issues = issuesOf(() => loadAppConfig(roleOf(Role.Api), env));

      expect(variablesOf(issues)).toEqual([EnvVar.SecretBoxKey]);
      expect(() => loadAppConfig(roleOf(Role.Api), env)).toThrow(EnvVar.SecretBoxKey);
    },
  );

  it.each([undefined, '0', '-1', '1.5', 'v1'])(
    'requires a positive whole secret box key version: %s',
    (version) => {
      const env = createTestEnv({ [EnvVar.SecretBoxKeyVersion]: version });

      const issues = issuesOf(() => loadAppConfig(roleOf(Role.Api), env));

      expect(variablesOf(issues)).toEqual([EnvVar.SecretBoxKeyVersion]);
    },
  );

  it.each([OLD_KEY, `0:${OLD_KEY}`, `1:${OLD_KEY}:2`, `1:short`, `1:${OLD_KEY},`])(
    'rejects previous secret box keys that are not version:key pairs: %s',
    (previous) => {
      const env = createTestEnv({ [EnvVar.SecretBoxPreviousKeys]: previous });

      const issues = issuesOf(() => loadAppConfig(roleOf(Role.Api), env));

      expect(variablesOf(issues)).toEqual([EnvVar.SecretBoxPreviousKeys]);
    },
  );

  it.each([`1:${OLD_KEY}`, `2:${OLD_KEY},2:${OTHER_KEY}`])(
    'rejects a secret box key version used twice: %s',
    (previous) => {
      const env = createTestEnv({
        [EnvVar.SecretBoxKeyVersion]: '1',
        [EnvVar.SecretBoxPreviousKeys]: previous,
      });

      const issues = issuesOf(() => loadAppConfig(roleOf(Role.Api), env));

      expect(variablesOf(issues)).toEqual([EnvVar.SecretBoxPreviousKeys]);
    },
  );

  it('reads the LLM base url, key and embedding model', () => {
    const env = createTestEnv({ [EnvVar.LlmApiKey]: 'llm-key' });

    const config = loadAppConfig(roleOf(Role.Worker), env);

    expect(config.llm).toEqual({
      baseUrl: env[EnvVar.LlmBaseUrl],
      apiKey: 'llm-key',
      embeddingModel: env[EnvVar.EmbeddingModel],
    });
  });

  it.each([undefined, ''])('boots without an LLM key: %s', (apiKey) => {
    const env = createTestEnv({ [EnvVar.LlmApiKey]: apiKey });

    const config = loadAppConfig(roleOf(Role.Api), env);

    expect(config.llm.apiKey).toBeNull();
  });

  it.each([
    [EnvVar.LlmBaseUrl, undefined],
    [EnvVar.LlmBaseUrl, 'ftp://llm.example.test/v1'],
    [EnvVar.LlmBaseUrl, 'not a url'],
    [EnvVar.EmbeddingModel, undefined],
    [EnvVar.EmbeddingModel, ''],
    [EnvVar.EmbeddingModel, 'text-embedding-unknown'],
  ])('stops boot on a bad %s: %s', (variable, value) => {
    const env = createTestEnv({ [variable]: value });

    const issues = issuesOf(() => loadAppConfig(roleOf(Role.Api), env));

    expect(variablesOf(issues)).toEqual([variable]);
  });

  it('reads the SMTP settings in smtp mode', () => {
    const env = createTestEnv({ [EnvVar.EmailMode]: EmailMode.Smtp, [EnvVar.SmtpPort]: '2525' });

    const config = loadAppConfig(roleOf(Role.Worker), env);

    expect(config.email).toEqual({
      mode: EmailMode.Smtp,
      from: env[EnvVar.EmailFrom],
      smtp: {
        host: env[EnvVar.SmtpHost],
        port: 2525,
        secure: false,
        requireTls: false,
        credentials: null,
      },
    });
  });

  it('reads SMTP TLS and credentials', () => {
    const env = createTestEnv({
      [EnvVar.SmtpSecure]: 'true',
      [EnvVar.SmtpRequireTls]: 'true',
      [EnvVar.SmtpUser]: 'mailer',
      [EnvVar.SmtpPassword]: 'mailer-password',
    });

    const config = loadAppConfig(roleOf(Role.Worker), env);

    expect(config.email.mode === EmailMode.Smtp ? config.email.smtp : null).toMatchObject({
      secure: true,
      requireTls: true,
      credentials: { user: 'mailer', password: 'mailer-password' },
    });
  });

  it.each([
    { [EnvVar.SmtpUser]: 'mailer', [EnvVar.SmtpPassword]: '' },
    { [EnvVar.SmtpUser]: undefined, [EnvVar.SmtpPassword]: 'mailer-password' },
  ])('requires both SMTP credentials or neither', (credentials) => {
    const env = createTestEnv(credentials);

    const issues = issuesOf(() => loadAppConfig(roleOf(Role.Worker), env));

    expect(variablesOf(issues)).toEqual([EnvVar.SmtpPassword]);
  });

  it('requires the SMTP TLS switches in smtp mode', () => {
    const env = createTestEnv({ [EnvVar.SmtpSecure]: undefined, [EnvVar.SmtpRequireTls]: 'maybe' });

    const issues = issuesOf(() => loadAppConfig(roleOf(Role.Worker), env));

    expect(variablesOf(issues)).toEqual([EnvVar.SmtpSecure, EnvVar.SmtpRequireTls]);
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
