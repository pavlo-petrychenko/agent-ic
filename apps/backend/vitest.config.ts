import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [swc.vite()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: '@test', replacement: fileURLToPath(new URL('./test', import.meta.url)) },
      { find: /^graphql$/, replacement: createRequire(import.meta.url).resolve('graphql') },
    ],
  },
  test: {
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    globalSetup: ['test/support/setup/test-infrastructure.setup.ts'],
  },
});
