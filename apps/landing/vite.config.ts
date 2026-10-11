import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { readLandingEnv } from './vite.env.ts';
import { landingPages } from './vite.pages.ts';
import { pageEntries } from './vite.render.ts';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const SOURCE = fileURLToPath(new URL('./src', import.meta.url));
const BUILD_YEAR = new Date().getFullYear();

export default defineConfig(({ mode }) => ({
  plugins: [landingPages(ROOT, readLandingEnv(mode), BUILD_YEAR)],
  resolve: { alias: { '@': SOURCE } },
  build: { modulePreload: { polyfill: false }, rolldownOptions: { input: pageEntries(ROOT) } },
}));
