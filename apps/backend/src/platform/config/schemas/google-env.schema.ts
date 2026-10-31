import { z } from 'zod';
import { GOOGLE_CONFIG_REQUIRED_MESSAGE } from '@/platform/config/constants/env-value.constants';
import { EnvVar } from '@/platform/config/constants/env.constants';
import {
  optionalPublicUrlSchema,
  optionalTextSchema,
} from '@/platform/config/schemas/env-value.schema';
import type {
  GoogleConfig,
  GooglePickerConfig,
} from '@/platform/config/typedefs/app-config.typedefs';

const oauthVariables = [
  EnvVar.GoogleClientId,
  EnvVar.GoogleClientSecret,
  EnvVar.GoogleOAuthRedirectUri,
] as const;

const pickerVariables = [EnvVar.GooglePickerApiKey, EnvVar.GooglePickerAppId] as const;

const requirePair = (
  variables: readonly EnvVar[],
  env: Readonly<Record<string, string | null>>,
  context: z.RefinementCtx,
): void => {
  const configured = variables.filter((variable) => env[variable] !== null).length;
  if (configured === 0 || configured === variables.length) {
    return;
  }
  for (const variable of variables) {
    if (env[variable] === null) {
      context.addIssue({
        code: 'custom',
        message: GOOGLE_CONFIG_REQUIRED_MESSAGE,
        path: [variable],
      });
    }
  }
};

const pickerConfig = (apiKey: string | null, appId: string | null): GooglePickerConfig =>
  apiKey === null || appId === null ? { enabled: false } : { enabled: true, apiKey, appId };

export const googleEnvSchema = z
  .object({
    [EnvVar.GoogleClientId]: optionalTextSchema,
    [EnvVar.GoogleClientSecret]: optionalTextSchema,
    [EnvVar.GoogleOAuthRedirectUri]: optionalPublicUrlSchema,
    [EnvVar.GooglePickerApiKey]: optionalTextSchema,
    [EnvVar.GooglePickerAppId]: optionalTextSchema,
  })
  .superRefine((env, context) => {
    requirePair(oauthVariables, env, context);
    requirePair(pickerVariables, env, context);
  })
  .transform((env): GoogleConfig => {
    const clientId = env[EnvVar.GoogleClientId];
    const clientSecret = env[EnvVar.GoogleClientSecret];
    const redirectUri = env[EnvVar.GoogleOAuthRedirectUri];
    if (clientId === null || clientSecret === null || redirectUri === null) {
      return { enabled: false };
    }
    return {
      enabled: true,
      clientId,
      clientSecret,
      redirectUri,
      picker: pickerConfig(env[EnvVar.GooglePickerApiKey], env[EnvVar.GooglePickerAppId]),
    };
  });
