import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import { testAliases } from '../vite.resolve.ts';

const config: StorybookConfig = {
  stories: ['../src/shared/ui/**/*.stories.tsx'],
  addons: ['@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
  viteFinal: (viteConfig) => mergeConfig(viteConfig, { resolve: { alias: testAliases } }),
};

export default config;
