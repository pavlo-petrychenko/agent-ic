import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: [
    './src/modules/*/db/*.{table,pg-schema}.ts',
    './src/platform/*/db/*.{table,pg-schema}.ts',
  ],
  out: './migrations',
});
