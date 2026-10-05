import { defineConfig } from 'vitest/config';

const conditions = ['source', 'import', 'module', 'node', 'default'];

export default defineConfig({
  resolve: { conditions, tsconfigPaths: true },
  ssr: { resolve: { conditions } },
  test: {
    include: ['src/**/*.spec.ts'],
  },
});
