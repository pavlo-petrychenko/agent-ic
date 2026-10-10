import { z } from 'zod';
import { EnvVar } from '@/platform/config/constants/env.constants';
import {
  optionalTextSchema,
  publicUrlSchema,
  textSchema,
} from '@/platform/config/schemas/env-value.schema';
import type { LlmConfig } from '@/platform/config/typedefs/app-config.typedefs';

export const llmEnvSchema = z
  .object({
    [EnvVar.LlmBaseUrl]: publicUrlSchema,
    [EnvVar.LlmApiKey]: optionalTextSchema,
    [EnvVar.EmbeddingModel]: textSchema,
  })
  .transform((env): LlmConfig => ({
    baseUrl: env[EnvVar.LlmBaseUrl],
    apiKey: env[EnvVar.LlmApiKey],
    embeddingModel: env[EnvVar.EmbeddingModel],
  }));
