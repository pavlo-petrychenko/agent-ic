import { z } from 'zod';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { publicUrlSchema, textSchema } from '@/platform/config/schemas/env-value.schema';
import type { StorageConfig } from '@/platform/config/typedefs/app-config.typedefs';

export const storageEnvSchema = z
  .object({
    [EnvVar.S3Endpoint]: publicUrlSchema,
    [EnvVar.S3PublicEndpoint]: publicUrlSchema,
    [EnvVar.S3Region]: textSchema,
    [EnvVar.S3AccessKeyId]: textSchema,
    [EnvVar.S3SecretAccessKey]: textSchema,
    [EnvVar.S3Bucket]: textSchema,
    [EnvVar.S3ForcePathStyle]: z.stringbool(),
  })
  .transform((env): StorageConfig => ({
    endpoint: env[EnvVar.S3Endpoint],
    publicEndpoint: env[EnvVar.S3PublicEndpoint],
    region: env[EnvVar.S3Region],
    accessKeyId: env[EnvVar.S3AccessKeyId],
    secretAccessKey: env[EnvVar.S3SecretAccessKey],
    bucket: env[EnvVar.S3Bucket],
    forcePathStyle: env[EnvVar.S3ForcePathStyle],
  }));
