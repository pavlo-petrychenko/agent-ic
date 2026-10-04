import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { resolveOptions, testAliases } from './vite.resolve.ts';

export default defineConfig({
  plugins: [react()],
  resolve: { ...resolveOptions, alias: testAliases },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'vite.*.test.ts'],
    setupFiles: ['./test/support/setup/vitest.setup.ts'],
  },
});
