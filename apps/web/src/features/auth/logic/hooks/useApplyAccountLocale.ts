import type { Locale } from '@agent-ic/contracts';
import { useEffect, useRef } from 'react';
import { useLocale } from '@/shared/i18n/hooks/useLocale';

export function useApplyAccountLocale(accountLocale: Locale | null): void {
  const { locale, setLocale } = useLocale();
  const applied = useRef<Locale | null>(null);

  useEffect(() => {
    if (accountLocale === null || accountLocale === applied.current) {
      return;
    }

    applied.current = accountLocale;
    if (accountLocale !== locale) {
      setLocale(accountLocale);
    }
  }, [accountLocale, locale, setLocale]);
}
