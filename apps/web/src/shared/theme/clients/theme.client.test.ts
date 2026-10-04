import { describe, expect, it, vi } from 'vitest';
import { createThemeClient } from '@/shared/theme/clients/theme.client';
import {
  ResolvedTheme,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  ThemePreference,
} from '@/shared/theme/constants/theme.constants';
import { createFakeColorSchemeQuery } from '@test/support/helpers/colorScheme.helpers';

const setup = (prefersDark: boolean) => {
  const colorScheme = createFakeColorSchemeQuery(prefersDark);
  const root = document.createElement('html');
  const client = createThemeClient({
    getStorage: () => window.localStorage,
    root,
    colorSchemeQuery: colorScheme.query,
  });
  return { client, root, colorScheme };
};

describe('createThemeClient', () => {
  it('applies the stored preference on start', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, ThemePreference.Dark);

    const { client, root } = setup(false);

    expect(client.getSnapshot()).toEqual({
      preference: ThemePreference.Dark,
      resolvedTheme: ResolvedTheme.Dark,
    });
    expect(root.getAttribute(THEME_ATTRIBUTE)).toBe(ResolvedTheme.Dark);
  });

  it('follows the operating system while the preference is system', () => {
    const { client, root, colorScheme } = setup(false);
    const listener = vi.fn<() => void>();
    client.subscribe(listener);

    colorScheme.setPrefersDark(true);

    expect(client.getSnapshot().resolvedTheme).toBe(ResolvedTheme.Dark);
    expect(root.getAttribute(THEME_ATTRIBUTE)).toBe(ResolvedTheme.Dark);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignores the operating system once a theme is chosen', () => {
    const { client, root, colorScheme } = setup(false);

    client.setPreference(ThemePreference.Light);
    colorScheme.setPrefersDark(true);

    expect(client.getSnapshot().resolvedTheme).toBe(ResolvedTheme.Light);
    expect(root.getAttribute(THEME_ATTRIBUTE)).toBe(ResolvedTheme.Light);
  });

  it('persists a chosen preference and notifies subscribers until they unsubscribe', () => {
    const { client } = setup(false);
    const listener = vi.fn<() => void>();
    const unsubscribe = client.subscribe(listener);

    client.setPreference(ThemePreference.Dark);
    unsubscribe();
    client.setPreference(ThemePreference.System);

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(ThemePreference.System);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
