import { z } from 'zod';
import {
  NO_REDIS_KEY_PREFIX,
  OTEL_ENDPOINT_REQUIRED_MESSAGE,
  TRACES_SAMPLER_RATIO_DEFAULT,
} from '@/platform/config/constants/env-value.constants';
import { EnvVar, NodeEnvironment } from '@/platform/config/constants/env.constants';
import { LogLevel } from '@/platform/config/constants/log-level.constants';
import {
  databaseUrlSchema,
  optionalTextSchema,
  poolSizeSchema,
  publicUrlSchema,
  redisUrlSchema,
  sampleRateSchema,
  textSchema,
} from '@/platform/config/schemas/env-value.schema';
import type { CommonEnvironment } from '@/platform/config/typedefs/env.typedefs';

export const commonEnvSchema = z
  .object({
    [EnvVar.NodeEnv]: z.enum(NodeEnvironment),
    [EnvVar.AppVersion]: textSchema,
    [EnvVar.LogLevel]: z.enum(LogLevel),
    [EnvVar.HttpHost]: textSchema,
    [EnvVar.PublicUrl]: publicUrlSchema,
    [EnvVar.OtelSdkDisabled]: z.stringbool(),
    [EnvVar.OtelExporterEndpoint]: z.url().optional(),
    [EnvVar.OtelServiceName]: textSchema,
    [EnvVar.OtelServiceNamespace]: textSchema,
    [EnvVar.OtelTracesSamplerArg]: sampleRateSchema.default(TRACES_SAMPLER_RATIO_DEFAULT),
    [EnvVar.DeploymentEnvironment]: optionalTextSchema,
    [EnvVar.DatabaseUrl]: databaseUrlSchema,
    [EnvVar.DatabaseSystemUrl]: databaseUrlSchema,
    [EnvVar.DatabasePoolMax]: poolSizeSchema,
    [EnvVar.RedisQueueUrl]: redisUrlSchema,
    [EnvVar.RedisCacheUrl]: redisUrlSchema,
  })
  .refine((env) => env[EnvVar.OtelSdkDisabled] || env[EnvVar.OtelExporterEndpoint] !== undefined, {
    message: OTEL_ENDPOINT_REQUIRED_MESSAGE,
    path: [EnvVar.OtelExporterEndpoint],
  })
  .transform((env): CommonEnvironment => ({
    nodeEnv: env[EnvVar.NodeEnv],
    version: env[EnvVar.AppVersion],
    logLevel: env[EnvVar.LogLevel],
    host: env[EnvVar.HttpHost],
    publicUrl: env[EnvVar.PublicUrl],
    database: {
      url: env[EnvVar.DatabaseUrl],
      systemUrl: env[EnvVar.DatabaseSystemUrl],
      poolMax: env[EnvVar.DatabasePoolMax],
    },
    redis: {
      queueUrl: env[EnvVar.RedisQueueUrl],
      cacheUrl: env[EnvVar.RedisCacheUrl],
      keyPrefix: NO_REDIS_KEY_PREFIX,
    },
    telemetry: {
      enabled: !env[EnvVar.OtelSdkDisabled],
      endpoint: env[EnvVar.OtelExporterEndpoint] ?? null,
      serviceName: env[EnvVar.OtelServiceName],
      serviceNamespace: env[EnvVar.OtelServiceNamespace],
      serviceVersion: env[EnvVar.AppVersion],
      deploymentEnvironment: env[EnvVar.DeploymentEnvironment],
      samplerRatio: env[EnvVar.OtelTracesSamplerArg],
    },
  }));
