import type { NodeEnvironment } from '@/platform/config/constants/env.constants';
import type { LogLevel } from '@/platform/config/constants/log-level.constants';
import type {
  DatabaseConfig,
  PlatformAdminConfig,
  RedisConfig,
  TelemetryConfig,
  WorkerRuntimeConfig,
} from '@/platform/config/typedefs/app-config.typedefs';
import type { Role } from '@/platform/module-roles/constants/role.constants';

export interface ApiEnvironment {
  readonly role: Role.Api;
  readonly port: number;
  readonly platformAdmin: PlatformAdminConfig;
}

export interface GatewayEnvironment {
  readonly role: Role.Gateway;
  readonly port: number;
}

export interface WorkerEnvironment {
  readonly role: Role.Worker;
  readonly port: number;
  readonly worker: WorkerRuntimeConfig;
}

export type RoleEnvironment = ApiEnvironment | GatewayEnvironment | WorkerEnvironment;

export interface CommonEnvironment {
  readonly nodeEnv: NodeEnvironment;
  readonly version: string;
  readonly logLevel: LogLevel;
  readonly host: string;
  readonly publicUrl: string;
  readonly database: DatabaseConfig;
  readonly redis: RedisConfig;
  readonly telemetry: TelemetryConfig;
}
