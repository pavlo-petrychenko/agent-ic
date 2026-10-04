import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  ResolvedTheme,
  THEME_ATTRIBUTE,
  ThemePreference,
} from '@/shared/theme/constants/theme.constants';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { createFakeColorSchemeQuery } from '@test/support/helpers/colorScheme.helpers';

describe('useTheme', () => {
  it('exposes the preference and re-renders when it changes', () => {
    const colorScheme = createFakeColorSchemeQuery(true);
    vi.stubGlobal('matchMedia', () => colorScheme.query);
    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe(ThemePreference.System);
    expect(result.current.resolvedTheme).toBe(ResolvedTheme.Dark);

    act(() => result.current.setPreference(ThemePreference.Light));

    expect(result.current.preference).toBe(ThemePreference.Light);
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe(ResolvedTheme.Light);
    vi.unstubAllGlobals();
  });
});
