import { z } from 'zod';
import { EnvVar, NodeEnvironment } from '@/platform/config/constants/env.constants';
import { LogLevel } from '@/platform/config/constants/log-level.constants';
import {
  databaseUrlSchema,
  poolSizeSchema,
  redisUrlSchema,
  textSchema,
} from '@/platform/config/schemas/env-value.schema';
import type { CommonEnvironment } from '@/platform/config/typedefs/env.typedefs';

export const commonEnvSchema = z
  .object({
    [EnvVar.NodeEnv]: z.enum(NodeEnvironment),
    [EnvVar.AppVersion]: textSchema,
    [EnvVar.LogLevel]: z.enum(LogLevel),
    [EnvVar.HttpHost]: textSchema,
    [EnvVar.OtelSdkDisabled]: z.stringbool(),
    [EnvVar.OtelExporterEndpoint]: z.url(),
    [EnvVar.OtelServiceName]: textSchema,
    [EnvVar.OtelServiceNamespace]: textSchema,
    [EnvVar.DatabaseUrl]: databaseUrlSchema,
    [EnvVar.DatabaseSystemUrl]: databaseUrlSchema,
    [EnvVar.DatabasePoolMax]: poolSizeSchema,
    [EnvVar.RedisQueueUrl]: redisUrlSchema,
    [EnvVar.RedisCacheUrl]: redisUrlSchema,
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
