import { z } from 'zod';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { LogLevel } from '@/platform/config/constants/log-level.constants';
import { databaseUrlSchema } from '@/platform/config/schemas/env-value.schema';
import type { MigrationConfig } from '@/platform/config/typedefs/migration-config.typedefs';

export const migrationEnvSchema = z
  .object({
    [EnvVar.LogLevel]: z.enum(LogLevel),
    [EnvVar.DatabaseOwnerUrl]: databaseUrlSchema,
  })
  .transform((env): MigrationConfig => ({
    logLevel: env[EnvVar.LogLevel],
    ownerUrl: env[EnvVar.DatabaseOwnerUrl],
  }));
