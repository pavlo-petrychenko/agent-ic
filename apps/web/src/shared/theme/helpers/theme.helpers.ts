import {
  DEFAULT_THEME_PREFERENCE,
  ResolvedTheme,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  ThemePreference,
} from '@/shared/theme/constants/theme.constants';
import type { ThemeSnapshot } from '@/shared/theme/typedefs/theme.typedefs';

const THEME_PREFERENCES: ReadonlySet<string> = new Set(Object.values(ThemePreference));

export const isThemePreference = (value: string | null): value is ThemePreference =>
  value !== null && THEME_PREFERENCES.has(value);

export const readStoredPreference = (getStorage: () => Storage): ThemePreference => {
  try {
    const stored = getStorage().getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : DEFAULT_THEME_PREFERENCE;
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
};

export const storePreference = (getStorage: () => Storage, preference: ThemePreference): void => {
  try {
    getStorage().setItem(THEME_STORAGE_KEY, preference);
  } catch {
    return;
  }
};

export const resolveTheme = (preference: ThemePreference, prefersDark: boolean): ResolvedTheme => {
  if (preference === ThemePreference.System) {
    return prefersDark ? ResolvedTheme.Dark : ResolvedTheme.Light;
  }
  return preference === ThemePreference.Dark ? ResolvedTheme.Dark : ResolvedTheme.Light;
};

export const buildThemeSnapshot = (
  preference: ThemePreference,
  prefersDark: boolean,
): ThemeSnapshot => ({ preference, resolvedTheme: resolveTheme(preference, prefersDark) });

export const applyResolvedTheme = (root: HTMLElement, theme: ResolvedTheme): void => {
  root.setAttribute(THEME_ATTRIBUTE, theme);
};
