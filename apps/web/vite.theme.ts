import type { Plugin } from 'vite';
import {
  DARK_COLOR_SCHEME_QUERY,
  ResolvedTheme,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  ThemePreference,
} from './src/shared/theme/constants/theme.constants.ts';

const PLUGIN_NAME = 'agent-ic:theme-before-paint';
const SCRIPT_TAG = 'script';
const INJECT_TO = 'head-prepend';

interface ThemeScriptConfig {
  readonly storageKey: string;
  readonly attribute: string;
  readonly darkQuery: string;
  readonly darkPreference: string;
  readonly lightPreference: string;
  readonly darkTheme: string;
  readonly lightTheme: string;
}

export const THEME_SCRIPT_CONFIG: ThemeScriptConfig = {
  storageKey: THEME_STORAGE_KEY,
  attribute: THEME_ATTRIBUTE,
  darkQuery: DARK_COLOR_SCHEME_QUERY,
  darkPreference: ThemePreference.Dark,
  lightPreference: ThemePreference.Light,
  darkTheme: ResolvedTheme.Dark,
  lightTheme: ResolvedTheme.Light,
};

export function applyThemeBeforePaint(config: ThemeScriptConfig): void {
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(config.storageKey);
  } catch {
    stored = null;
  }
  const prefersDark = window.matchMedia(config.darkQuery).matches;
  const dark =
    stored === config.darkPreference || (stored !== config.lightPreference && prefersDark);
  document.documentElement.setAttribute(
    config.attribute,
    dark ? config.darkTheme : config.lightTheme,
  );
}

export const buildThemeScript = (): string =>
  `(${applyThemeBeforePaint.toString()})(${JSON.stringify(THEME_SCRIPT_CONFIG)});`;

export const themeBeforePaint = (): Plugin => ({
  name: PLUGIN_NAME,
  transformIndexHtml: () => [
    { tag: SCRIPT_TAG, children: buildThemeScript(), injectTo: INJECT_TO },
  ],
});
