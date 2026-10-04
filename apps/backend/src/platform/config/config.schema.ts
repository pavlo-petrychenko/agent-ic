import { z } from 'zod';

import { QueueName } from '@/platform/queues/queue.constants';

import {
  DATABASE_URL_PROTOCOL,
  EnvVar,
  LangfuseMode,
  LogLevel,
  NodeEnvironment,
  PORT_MAX,
  PORT_MIN,
  PLATFORM_ADMIN_DEV_ACCESS_IN_PRODUCTION_MESSAGE,
  POOL_SIZE_MIN,
  REDIS_URL_PROTOCOL,
  Role,
  SAMPLE_RATE_MAX,
  SAMPLE_RATE_MIN,
  WORKER_CONCURRENCY_MIN,
  WORKER_QUEUES_REQUIRED_MESSAGE,
} from './config.constants';
import type {
  ApiEnvironment,
  CommonEnvironment,
  GatewayEnvironment,
  LangfuseActiveConfig,
  LangfuseConfig,
  MigrationConfig,
  RoleEnvironment,
  WorkerEnvironment,
} from './config.typedefs';

const text = z.string().min(1);
const port = z.coerce.number().int().min(PORT_MIN).max(PORT_MAX);
const sampleRate = z.coerce.number().min(SAMPLE_RATE_MIN).max(SAMPLE_RATE_MAX);
const databaseUrl = z.url({ protocol: DATABASE_URL_PROTOCOL });
const poolSize = z.coerce.number().int().min(POOL_SIZE_MIN);
const redisUrl = z.url({ protocol: REDIS_URL_PROTOCOL });
const concurrency = z.coerce.number().int().min(WORKER_CONCURRENCY_MIN);

export const cliSchema = z
  .object({
    role: z.enum(Role),
    queues: z.array(z.enum(QueueName)),
  })
  .refine((cli) => cli.role !== Role.Worker || cli.queues.length > 0, {
    path: ['queues'],
    message: WORKER_QUEUES_REQUIRED_MESSAGE,
  });

export const schemaPrintCliSchema = z.object({ output: text });

export const commonEnvSchema = z
  .object({
    [EnvVar.NodeEnv]: z.enum(NodeEnvironment),
    [EnvVar.AppVersion]: text,
    [EnvVar.LogLevel]: z.enum(LogLevel),
    [EnvVar.HttpHost]: text,
    [EnvVar.OtelSdkDisabled]: z.stringbool(),
    [EnvVar.OtelExporterEndpoint]: z.url(),
    [EnvVar.OtelServiceName]: text,
    [EnvVar.OtelServiceNamespace]: text,
    [EnvVar.DatabaseUrl]: databaseUrl,
    [EnvVar.DatabaseSystemUrl]: databaseUrl,
    [EnvVar.DatabasePoolMax]: poolSize,
    [EnvVar.RedisQueueUrl]: redisUrl,
    [EnvVar.RedisCacheUrl]: redisUrl,
  })
  .transform((env): CommonEnvironment => ({
    nodeEnv: env[EnvVar.NodeEnv],
    version: env[EnvVar.AppVersion],
    logLevel: env[EnvVar.LogLevel],
    host: env[EnvVar.HttpHost],
    database: {
      url: env[EnvVar.DatabaseUrl],
      systemUrl: env[EnvVar.DatabaseSystemUrl],
      poolMax: env[EnvVar.DatabasePoolMax],
    },
    redis: {
      queueUrl: env[EnvVar.RedisQueueUrl],
      cacheUrl: env[EnvVar.RedisCacheUrl],
    },
    telemetry: {
      enabled: !env[EnvVar.OtelSdkDisabled],
      endpoint: env[EnvVar.OtelExporterEndpoint],
      serviceName: env[EnvVar.OtelServiceName],
      serviceNamespace: env[EnvVar.OtelServiceNamespace],
    },
  }));

const langfuseDisabledSchema = z.object({
  [EnvVar.LangfuseMode]: z.literal(LangfuseMode.Off),
  [EnvVar.LangfuseSampleRate]: sampleRate,
});

const langfuseActiveSchema = z.object({
  [EnvVar.LangfuseMode]: z.enum([LangfuseMode.Cloud, LangfuseMode.SelfHosted]),
  [EnvVar.LangfuseSampleRate]: sampleRate,
  [EnvVar.LangfuseHost]: z.url(),
  [EnvVar.LangfusePublicKey]: text,
  [EnvVar.LangfuseSecretKey]: text,
});

export const langfuseEnvSchema = z
  .discriminatedUnion(EnvVar.LangfuseMode, [langfuseDisabledSchema, langfuseActiveSchema])
  .transform((env): LangfuseConfig => {
    if (env[EnvVar.LangfuseMode] === LangfuseMode.Off) {
      return { mode: LangfuseMode.Off, sampleRate: env[EnvVar.LangfuseSampleRate] };
    }
    const active: LangfuseActiveConfig = {
      mode: env[EnvVar.LangfuseMode],
      sampleRate: env[EnvVar.LangfuseSampleRate],
      host: env[EnvVar.LangfuseHost],
      publicKey: env[EnvVar.LangfusePublicKey],
      secretKey: env[EnvVar.LangfuseSecretKey],
    };
    return active;
  });

export const roleEnvSchemas: Record<Role, z.ZodType<RoleEnvironment>> = {
  [Role.Api]: z
    .object({
      [EnvVar.NodeEnv]: z.enum(NodeEnvironment),
      [EnvVar.ApiPort]: port,
      [EnvVar.PlatformAdminDevAccess]: z.stringbool(),
    })
    .refine(
      (env) =>
        !env[EnvVar.PlatformAdminDevAccess] || env[EnvVar.NodeEnv] !== NodeEnvironment.Production,
      {
        path: [EnvVar.PlatformAdminDevAccess],
        message: PLATFORM_ADMIN_DEV_ACCESS_IN_PRODUCTION_MESSAGE,
      },
    )
    .transform((env): ApiEnvironment => ({
      role: Role.Api,
      port: env[EnvVar.ApiPort],
      platformAdmin: { devAccess: env[EnvVar.PlatformAdminDevAccess] },
    })),
  [Role.Gateway]: z.object({ [EnvVar.GatewayPort]: port }).transform((env): GatewayEnvironment => ({
    role: Role.Gateway,
    port: env[EnvVar.GatewayPort],
  })),
  [Role.Worker]: z
    .object({ [EnvVar.WorkerPort]: port, [EnvVar.WorkerConcurrency]: concurrency })
    .transform((env): WorkerEnvironment => ({
      role: Role.Worker,
      port: env[EnvVar.WorkerPort],
      worker: { concurrency: env[EnvVar.WorkerConcurrency] },
    })),
};

export const migrationEnvSchema = z
  .object({
    [EnvVar.LogLevel]: z.enum(LogLevel),
    [EnvVar.DatabaseOwnerUrl]: databaseUrl,
  })
  .transform((env): MigrationConfig => ({
    logLevel: env[EnvVar.LogLevel],
    ownerUrl: env[EnvVar.DatabaseOwnerUrl],
  }));
