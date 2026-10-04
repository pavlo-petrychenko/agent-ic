import { z } from 'zod';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { LangfuseMode } from '@/platform/config/constants/langfuse.constants';
import { sampleRateSchema, textSchema } from '@/platform/config/schemas/env-value.schema';
import type {
  LangfuseActiveConfig,
  LangfuseConfig,
} from '@/platform/config/typedefs/app-config.typedefs';

const langfuseDisabledSchema = z.object({
  [EnvVar.LangfuseMode]: z.literal(LangfuseMode.Off),
  [EnvVar.LangfuseSampleRate]: sampleRateSchema,
});

const langfuseActiveSchema = z.object({
  [EnvVar.LangfuseMode]: z.enum([LangfuseMode.Cloud, LangfuseMode.SelfHosted]),
  [EnvVar.LangfuseSampleRate]: sampleRateSchema,
  [EnvVar.LangfuseHost]: z.url(),
  [EnvVar.LangfusePublicKey]: textSchema,
  [EnvVar.LangfuseSecretKey]: textSchema,
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
