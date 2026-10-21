import { z } from 'zod';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { usageLimitSchema } from '@/platform/config/schemas/env-value.schema';
import type { UsageConfig } from '@/platform/config/typedefs/app-config.typedefs';

export const usageEnvSchema = z
  .object({
    [EnvVar.UsageCreditsLimit]: usageLimitSchema,
    [EnvVar.UsageConversationsLimit]: usageLimitSchema,
    [EnvVar.UsageChunksLimit]: usageLimitSchema,
  })
  .transform((env): UsageConfig => ({
    creditsLimit: env[EnvVar.UsageCreditsLimit],
    conversationsLimit: env[EnvVar.UsageConversationsLimit],
    chunksLimit: env[EnvVar.UsageChunksLimit],
  }));
