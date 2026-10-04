import { z } from 'zod';
import { JWT_SECRET_MIN_LENGTH } from '@/platform/config/constants/env-value.constants';
import { EnvVar } from '@/platform/config/constants/env.constants';
import type { AuthConfig } from '@/platform/config/typedefs/app-config.typedefs';

export const authEnvSchema = z
  .object({
    [EnvVar.JwtAccessSecret]: z.string().min(JWT_SECRET_MIN_LENGTH),
  })
  .transform((env): AuthConfig => ({ accessTokenSecret: env[EnvVar.JwtAccessSecret] }));
