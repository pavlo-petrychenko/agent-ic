export enum Role {
  Api = 'api',
  Gateway = 'gateway',
  Worker = 'worker',
}

export enum NodeEnvironment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export enum LogLevel {
  Fatal = 'fatal',
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
  Trace = 'trace',
  Silent = 'silent',
}

export enum LangfuseMode {
  Off = 'off',
  Cloud = 'cloud',
  SelfHosted = 'self-hosted',
}

export enum CliOption {
  Role = 'role',
  Queues = 'queues',
}

export enum SchemaPrintOption {
  Output = 'output',
}

export enum EnvVar {
  NodeEnv = 'NODE_ENV',
  AppVersion = 'APP_VERSION',
  LogLevel = 'LOG_LEVEL',
  HttpHost = 'HTTP_HOST',
  ApiPort = 'API_PORT',
  GatewayPort = 'GATEWAY_PORT',
  WorkerPort = 'WORKER_PORT',
  DatabaseUrl = 'DATABASE_URL',
  DatabaseSystemUrl = 'DATABASE_SYSTEM_URL',
  DatabaseOwnerUrl = 'DATABASE_OWNER_URL',
  DatabasePoolMax = 'DATABASE_POOL_MAX',
  OtelSdkDisabled = 'OTEL_SDK_DISABLED',
  OtelExporterEndpoint = 'OTEL_EXPORTER_OTLP_ENDPOINT',
  OtelServiceName = 'OTEL_SERVICE_NAME',
  OtelServiceNamespace = 'OTEL_SERVICE_NAMESPACE',
  LangfuseMode = 'LANGFUSE_MODE',
  LangfuseSampleRate = 'LANGFUSE_SAMPLE_RATE',
  LangfuseHost = 'LANGFUSE_HOST',
  LangfusePublicKey = 'LANGFUSE_PUBLIC_KEY',
  LangfuseSecretKey = 'LANGFUSE_SECRET_KEY',
}

export const ARGV_OFFSET = 2;
export const QUEUE_LIST_SEPARATOR = ',';
export const PORT_MIN = 1;
export const PORT_MAX = 65535;
export const POOL_SIZE_MIN = 1;
export const DATABASE_URL_PROTOCOL = /^postgres(ql)?$/;
export const SAMPLE_RATE_MIN = 0;
export const SAMPLE_RATE_MAX = 1;
export const CONFIG_ERROR_HEADER = 'Invalid configuration:';
export const CONFIG_ISSUE_PATH_SEPARATOR = '.';
export const CONFIG_ISSUE_LINE_PREFIX = '  - ';
export const CONFIG_ISSUE_VALUE_SEPARATOR = ': ';
export const CONFIG_ISSUE_LINE_SEPARATOR = '\n';
export const CLI_OPTION_PREFIX = '--';
export const WORKER_QUEUES_REQUIRED_MESSAGE = 'at least one queue is required for the worker role';
export const CLI_ARGUMENTS_LABEL = 'arguments';
