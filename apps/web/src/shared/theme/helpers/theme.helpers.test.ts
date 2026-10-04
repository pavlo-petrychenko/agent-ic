import { describe, expect, it } from 'vitest';
import {
  ResolvedTheme,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  ThemePreference,
} from '@/shared/theme/constants/theme.constants';
import {
  applyResolvedTheme,
  readStoredPreference,
  resolveTheme,
  storePreference,
} from '@/shared/theme/helpers/theme.helpers';

const UNKNOWN_PREFERENCE = 'sepia';

const blockedStorage = (): Storage => {
  throw new Error('storage blocked');
};

describe('theme helpers', () => {
  it('reads a stored preference', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, ThemePreference.Dark);

    expect(readStoredPreference(() => window.localStorage)).toBe(ThemePreference.Dark);
  });

  it('falls back to system for a missing or unknown value', () => {
    expect(readStoredPreference(() => window.localStorage)).toBe(ThemePreference.System);

    window.localStorage.setItem(THEME_STORAGE_KEY, UNKNOWN_PREFERENCE);

    expect(readStoredPreference(() => window.localStorage)).toBe(ThemePreference.System);
  });

  it('falls back to system and does not throw when storage is blocked', () => {
    expect(readStoredPreference(blockedStorage)).toBe(ThemePreference.System);
    expect(() => storePreference(blockedStorage, ThemePreference.Dark)).not.toThrow();
  });

  it('stores a preference', () => {
    storePreference(() => window.localStorage, ThemePreference.Light);

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(ThemePreference.Light);
  });

  it.each([
    [ThemePreference.Light, true, ResolvedTheme.Light],
    [ThemePreference.Dark, false, ResolvedTheme.Dark],
    [ThemePreference.System, true, ResolvedTheme.Dark],
    [ThemePreference.System, false, ResolvedTheme.Light],
  ])('resolves %s with prefers-dark %s to %s', (preference, prefersDark, expected) => {
    expect(resolveTheme(preference, prefersDark)).toBe(expected);
  });

  it('applies the resolved theme as an attribute', () => {
    const root = document.createElement('html');

    applyResolvedTheme(root, ResolvedTheme.Dark);

    expect(root.getAttribute(THEME_ATTRIBUTE)).toBe(ResolvedTheme.Dark);
  });
});
