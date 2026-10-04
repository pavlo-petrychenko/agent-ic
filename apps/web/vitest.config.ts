import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

import { resolveOptions } from './vite.resolve.ts';

export default defineConfig({
  plugins: [react()],
  resolve: resolveOptions,
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'vite.*.test.ts'],
    setupFiles: ['./src/shared/testing/setup.ts'],
  },
});
