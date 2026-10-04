import type { QueueName } from '@/platform/queues/queue.constants';

import type { LangfuseMode, LogLevel, NodeEnvironment, Role } from './config.constants';

export interface HttpConfig {
  readonly host: string;
  readonly port: number;
}

export interface DatabaseConfig {
  readonly url: string;
  readonly systemUrl: string;
  readonly poolMax: number;
}

export interface MigrationConfig {
  readonly logLevel: LogLevel;
  readonly ownerUrl: string;
}

export interface TelemetryConfig {
  readonly enabled: boolean;
  readonly endpoint: string;
  readonly serviceName: string;
  readonly serviceNamespace: string;
}

export interface LangfuseDisabledConfig {
  readonly mode: LangfuseMode.Off;
  readonly sampleRate: number;
}

export interface LangfuseActiveConfig {
  readonly mode: LangfuseMode.Cloud | LangfuseMode.SelfHosted;
  readonly sampleRate: number;
  readonly host: string;
  readonly publicKey: string;
  readonly secretKey: string;
}

export type LangfuseConfig = LangfuseDisabledConfig | LangfuseActiveConfig;

export interface BaseConfig {
  readonly nodeEnv: NodeEnvironment;
  readonly version: string;
  readonly logLevel: LogLevel;
  readonly http: HttpConfig;
  readonly database: DatabaseConfig;
  readonly telemetry: TelemetryConfig;
  readonly langfuse: LangfuseConfig;
}

export interface ApiConfig extends BaseConfig {
  readonly role: Role.Api;
}

export interface GatewayConfig extends BaseConfig {
  readonly role: Role.Gateway;
}

export interface WorkerConfig extends BaseConfig {
  readonly role: Role.Worker;
  readonly queues: readonly QueueName[];
}

export type AppConfig = ApiConfig | GatewayConfig | WorkerConfig;

export interface CliArguments {
  readonly role: Role;
  readonly queues: readonly QueueName[];
}

export interface RawCliOptions {
  readonly role: string | undefined;
  readonly queues: readonly string[];
}

export interface RawSchemaPrintOptions {
  readonly output: string | undefined;
}

export interface SchemaPrintConfig {
  readonly output: string;
}

export interface ConfigIssue {
  readonly variable: string;
  readonly message: string;
}

export interface RoleEnvironment {
  readonly port: number;
}

export interface CommonEnvironment {
  readonly nodeEnv: NodeEnvironment;
  readonly version: string;
  readonly logLevel: LogLevel;
  readonly host: string;
  readonly database: DatabaseConfig;
  readonly telemetry: TelemetryConfig;
}
