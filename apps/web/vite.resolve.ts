import { fileURLToPath } from 'node:url';

import type { UserConfig } from 'vite';

export const resolveOptions: NonNullable<UserConfig['resolve']> = {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
  },
  conditions: ['source'],
};
