import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./src/modules/*/db/*.table.ts', './src/platform/*/db/*.table.ts'],
  out: './migrations',
});
