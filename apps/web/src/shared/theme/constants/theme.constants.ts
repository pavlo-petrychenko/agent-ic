export enum ThemePreference {
  Light = 'light',
  Dark = 'dark',
  System = 'system',
}

export enum ResolvedTheme {
  Light = 'light',
  Dark = 'dark',
}

export const DEFAULT_THEME_PREFERENCE = ThemePreference.System;
export const THEME_STORAGE_KEY = 'agent-ic.theme';
export const THEME_ATTRIBUTE = 'data-theme';
export const DARK_COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';
export const MEDIA_QUERY_CHANGE_EVENT = 'change';
