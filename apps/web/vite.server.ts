import { cwd } from 'node:process';

import { loadEnv, type ServerOptions } from 'vite';
import { z } from 'zod';

import { ALLOWED_HOSTS_SEPARATOR, SERVER_ENV_PREFIX } from './vite.constants.ts';

const serverEnvSchema = z.object({
  WEB_PORT: z.coerce.number().int().positive(),
  WEB_ALLOWED_HOSTS: z
    .string()
    .transform((value) => value.split(ALLOWED_HOSTS_SEPARATOR).map((host) => host.trim()))
    .pipe(z.array(z.string().min(1)).min(1)),
});

export const readServerOptions = (mode: string): ServerOptions => {
  const env = serverEnvSchema.parse(loadEnv(mode, cwd(), SERVER_ENV_PREFIX));
  return {
    host: true,
    port: env.WEB_PORT,
    strictPort: true,
    allowedHosts: env.WEB_ALLOWED_HOSTS,
  };
};
