import {
  EnvVar,
  LangfuseMode,
  LogLevel,
  NodeEnvironment,
} from '@/platform/config/config.constants';

export const TEST_ENV: Readonly<Record<EnvVar, string>> = {
  [EnvVar.NodeEnv]: NodeEnvironment.Test,
  [EnvVar.AppVersion]: '0.0.0-test',
  [EnvVar.LogLevel]: LogLevel.Silent,
  [EnvVar.HttpHost]: '127.0.0.1',
  [EnvVar.ApiPort]: '3000',
  [EnvVar.GatewayPort]: '3001',
  [EnvVar.WorkerPort]: '3002',
  [EnvVar.DatabaseUrl]: 'postgres://app:app@localhost:5432/agent_ic',
  [EnvVar.DatabaseSystemUrl]: 'postgres://app_system:app_system@localhost:5432/agent_ic',
  [EnvVar.DatabaseOwnerUrl]: 'postgres://app_owner:app_owner@localhost:5432/agent_ic',
  [EnvVar.DatabasePoolMax]: '2',
  [EnvVar.RedisQueueUrl]: 'redis://localhost:6379/0',
  [EnvVar.RedisCacheUrl]: 'redis://localhost:6379/0',
  [EnvVar.WorkerConcurrency]: '2',
  [EnvVar.PlatformAdminDevAccess]: 'false',
  [EnvVar.OtelSdkDisabled]: 'true',
  [EnvVar.OtelExporterEndpoint]: 'http://localhost:4318',
  [EnvVar.OtelServiceName]: 'test-service',
  [EnvVar.OtelServiceNamespace]: 'test-namespace',
  [EnvVar.LangfuseMode]: LangfuseMode.Off,
  [EnvVar.LangfuseSampleRate]: '1',
  [EnvVar.LangfuseHost]: 'http://localhost:3000',
  [EnvVar.LangfusePublicKey]: 'test-public-key',
  [EnvVar.LangfuseSecretKey]: 'test-secret-key',
};

export const TEST_ARGV_PREFIX: readonly string[] = ['node', 'main'];
