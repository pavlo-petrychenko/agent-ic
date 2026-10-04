import {
  EnvVar,
  LangfuseMode,
  LogLevel,
  NodeEnvironment,
} from '@/platform/config/config.constants';

export const TEST_ENV: Readonly<Record<EnvVar, string>> = {
  [EnvVar.NodeEnv]: NodeEnvironment.Test,
  [EnvVar.LogLevel]: LogLevel.Silent,
  [EnvVar.HttpHost]: '127.0.0.1',
  [EnvVar.ApiPort]: '3000',
  [EnvVar.GatewayPort]: '3001',
  [EnvVar.WorkerPort]: '3002',
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
