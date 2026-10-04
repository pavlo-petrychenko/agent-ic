import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import { useUptimeLabel } from '@/features/status/logic/hooks/useUptimeLabel';
import { createI18n } from '@/shared/i18n/i18n';
import { Locale } from '@/shared/i18n/i18n.constants';

const wrapperFor =
  (locale: Locale) =>
  ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={createI18n(locale)}>{children}</I18nextProvider>
  );

describe('useUptimeLabel', () => {
  it('writes English plurals', () => {
    const { result } = renderHook(() => useUptimeLabel(93_784), {
      wrapper: wrapperFor(Locale.En),
    });

    expect(result.current).toBe('1 day 2 hours');
  });

  it.each([
    [86_400 + 3_600, '1 день 1 година'],
    [2 * 86_400 + 5 * 3_600, '2 дні 5 годин'],
    [5 * 86_400 + 21 * 3_600, '5 днів 21 година'],
  ])('uses all three Ukrainian plural forms for %i seconds', (seconds, expected) => {
    const { result } = renderHook(() => useUptimeLabel(seconds), {
      wrapper: wrapperFor(Locale.Uk),
    });

    expect(result.current).toBe(expected);
  });

  it('has no label before the uptime is known', () => {
    const { result } = renderHook(() => useUptimeLabel(null), {
      wrapper: wrapperFor(Locale.En),
    });

    expect(result.current).toBeNull();
  });
});
