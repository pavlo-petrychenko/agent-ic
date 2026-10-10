import type { EmailMode } from '@/platform/config/constants/email.constants';
import type { NodeEnvironment } from '@/platform/config/constants/env.constants';
import type { LangfuseMode } from '@/platform/config/constants/langfuse.constants';
import type { LogLevel } from '@/platform/config/constants/log-level.constants';
import type { EmbeddingModelId } from '@/platform/llm/constants/llm-model.constants';
import type { Role } from '@/platform/module-roles/constants/role.constants';
import type { QueueName } from '@/platform/queues/constants/queue.constants';

export interface HttpConfig {
  readonly host: string;
  readonly port: number;
}

export interface DatabaseConfig {
  readonly url: string;
  readonly systemUrl: string;
  readonly poolMax: number;
}

export interface RedisConfig {
  readonly queueUrl: string;
  readonly cacheUrl: string;
  readonly keyPrefix: string;
}

export interface PlatformAdminConfig {
  readonly devAccess: boolean;
}

export interface WorkerRuntimeConfig {
  readonly concurrency: number;
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

export interface AuthConfig {
  readonly accessTokenSecret: string;
  readonly inviteTokenSecret: string;
}

export interface SecretBoxKey {
  readonly version: number;
  readonly key: string;
}

export interface SecretBoxConfig {
  readonly current: SecretBoxKey;
  readonly previous: readonly SecretBoxKey[];
}

export interface LlmConfig {
  readonly baseUrl: string;
  readonly apiKey: string | null;
  readonly embeddingModel: EmbeddingModelId;
}

export interface SmtpCredentials {
  readonly user: string;
  readonly password: string;
}

export interface SmtpConfig {
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly requireTls: boolean;
  readonly credentials: SmtpCredentials | null;
}

export interface ResendConfig {
  readonly apiKey: string;
}

export interface SmtpEmailConfig {
  readonly mode: EmailMode.Smtp;
  readonly from: string;
  readonly smtp: SmtpConfig;
}

export interface ResendEmailConfig {
  readonly mode: EmailMode.Resend;
  readonly from: string;
  readonly resend: ResendConfig;
}

export type EmailConfig = SmtpEmailConfig | ResendEmailConfig;

export interface BaseConfig {
  readonly nodeEnv: NodeEnvironment;
  readonly version: string;
  readonly logLevel: LogLevel;
  readonly publicUrl: string;
  readonly http: HttpConfig;
  readonly database: DatabaseConfig;
  readonly redis: RedisConfig;
  readonly telemetry: TelemetryConfig;
  readonly langfuse: LangfuseConfig;
  readonly auth: AuthConfig;
  readonly secretBox: SecretBoxConfig;
  readonly llm: LlmConfig;
  readonly email: EmailConfig;
}

export interface ApiConfig extends BaseConfig {
  readonly role: Role.Api;
  readonly platformAdmin: PlatformAdminConfig;
}

export interface GatewayConfig extends BaseConfig {
  readonly role: Role.Gateway;
}

export interface WorkerConfig extends BaseConfig {
  readonly role: Role.Worker;
  readonly queues: readonly QueueName[];
  readonly worker: WorkerRuntimeConfig;
}

export type AppConfig = ApiConfig | GatewayConfig | WorkerConfig;

export interface RoleSelection {
  readonly role: Role;
  readonly queues: readonly QueueName[];
}
