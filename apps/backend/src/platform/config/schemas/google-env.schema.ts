import { z } from 'zod';
import { GOOGLE_CONFIG_REQUIRED_MESSAGE } from '@/platform/config/constants/env-value.constants';
import { EnvVar } from '@/platform/config/constants/env.constants';
import {
  optionalPublicUrlSchema,
  optionalTextSchema,
} from '@/platform/config/schemas/env-value.schema';
import type { GoogleConfig } from '@/platform/config/typedefs/app-config.typedefs';

const googleVariables = [
  EnvVar.GoogleClientId,
  EnvVar.GoogleClientSecret,
  EnvVar.GoogleOAuthRedirectUri,
] as const;

export const googleEnvSchema = z
  .object({
    [EnvVar.GoogleClientId]: optionalTextSchema,
    [EnvVar.GoogleClientSecret]: optionalTextSchema,
    [EnvVar.GoogleOAuthRedirectUri]: optionalPublicUrlSchema,
  })
  .superRefine((env, context) => {
    const configured = googleVariables.filter((variable) => env[variable] !== null).length;
    if (configured === 0 || configured === googleVariables.length) {
      return;
    }
    for (const variable of googleVariables) {
      if (env[variable] === null) {
        context.addIssue({
          code: 'custom',
          message: GOOGLE_CONFIG_REQUIRED_MESSAGE,
          path: [variable],
        });
      }
    }
  })
  .transform((env): GoogleConfig => {
    const clientId = env[EnvVar.GoogleClientId];
    const clientSecret = env[EnvVar.GoogleClientSecret];
    const redirectUri = env[EnvVar.GoogleOAuthRedirectUri];
    if (clientId === null || clientSecret === null || redirectUri === null) {
      return { enabled: false };
    }
    return { enabled: true, clientId, clientSecret, redirectUri };
  });
