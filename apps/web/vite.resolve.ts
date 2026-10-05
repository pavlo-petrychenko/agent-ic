import { fileURLToPath } from 'node:url';
import type { UserConfig } from 'vite';

export const sourceAliases: Readonly<Record<string, string>> = {
  '@': fileURLToPath(new URL('./src', import.meta.url)),
};

export const testAliases: Readonly<Record<string, string>> = {
  ...sourceAliases,
  '@test': fileURLToPath(new URL('./test', import.meta.url)),
};

export const resolveOptions: NonNullable<UserConfig['resolve']> = {
  alias: sourceAliases,
  conditions: ['source'],
  tsconfigPaths: true,
};
