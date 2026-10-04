import { afterEach, describe, expect, it } from 'vitest';
import { createFakeColorSchemeQuery } from '@test/support/helpers/colorScheme.helpers';
import {
  ResolvedTheme,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  ThemePreference,
} from './src/shared/theme/constants/theme.constants.ts';
import { THEME_SCRIPT_CONFIG, applyThemeBeforePaint, buildThemeScript } from './vite.theme.ts';

const SCRIPT_TAG = 'script';
const LOCAL_STORAGE_PROPERTY = 'localStorage';
const localStorageDescriptor = Object.getOwnPropertyDescriptor(window, LOCAL_STORAGE_PROPERTY);

const runInlineScript = (prefersDark: boolean): string | null => {
  window.matchMedia = () => createFakeColorSchemeQuery(prefersDark).query;
  const script = document.createElement(SCRIPT_TAG);
  script.textContent = buildThemeScript();
  document.head.append(script);
  script.remove();
  return document.documentElement.getAttribute(THEME_ATTRIBUTE);
};

describe('theme before paint script', () => {
  afterEach(() => {
    if (localStorageDescriptor !== undefined) {
      Object.defineProperty(window, LOCAL_STORAGE_PROPERTY, localStorageDescriptor);
    }
    Reflect.deleteProperty(window, 'matchMedia');
    document.documentElement.removeAttribute(THEME_ATTRIBUTE);
  });

  it('follows the operating system when nothing is stored', () => {
    expect(runInlineScript(true)).toBe(ResolvedTheme.Dark);
    expect(runInlineScript(false)).toBe(ResolvedTheme.Light);
  });

  it('applies a stored choice over the operating system', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, ThemePreference.Light);
    expect(runInlineScript(true)).toBe(ResolvedTheme.Light);

    window.localStorage.setItem(THEME_STORAGE_KEY, ThemePreference.Dark);
    expect(runInlineScript(false)).toBe(ResolvedTheme.Dark);
  });

  it('follows the operating system when storage is blocked', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, ThemePreference.Light);
    Object.defineProperty(window, LOCAL_STORAGE_PROPERTY, {
      configurable: true,
      get: () => {
        throw new Error('storage blocked');
      },
    });

    window.matchMedia = () => createFakeColorSchemeQuery(true).query;

    applyThemeBeforePaint(THEME_SCRIPT_CONFIG);

    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe(ResolvedTheme.Dark);
  });
});
