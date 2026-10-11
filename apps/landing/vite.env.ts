import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { z } from 'zod';
import { ENV_PREFIX, TRAILING_SLASHES } from './vite.constants.ts';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

const originSchema = z
  .url({ protocol: /^https?$/ })
  .transform((value) => value.replace(TRAILING_SLASHES, ''));

const landingEnvSchema = z.object({
  LANDING_APP_URL: originSchema,
  LANDING_SITE_URL: originSchema,
});

export type LandingEnv = z.infer<typeof landingEnvSchema>;

export const readLandingEnv = (mode: string, envDirectory: string = REPO_ROOT): LandingEnv =>
  landingEnvSchema.parse(loadEnv(mode, envDirectory, ENV_PREFIX));
