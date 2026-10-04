import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { buildOptions } from './vite.build.ts';
import { resolveOptions } from './vite.resolve.ts';
import { readServerOptions } from './vite.server.ts';

export default defineConfig(({ command, mode }) => ({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), tailwindcss()],
  resolve: resolveOptions,
  build: buildOptions,
  server: command === 'serve' ? readServerOptions(mode) : undefined,
}));
