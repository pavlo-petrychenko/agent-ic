import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LOCALE, type Locale } from '@/shared/i18n/constants/locale.constants';
import { isLocale } from '@/shared/i18n/helpers/locale.helpers';
import { storeLocale } from '@/shared/i18n/helpers/localeStorage.helpers';

interface UseLocaleResult {
  readonly locale: Locale;
  readonly setLocale: (locale: Locale) => void;
}

export function useLocale(): UseLocaleResult {
  const { i18n } = useTranslation();
  const locale = isLocale(i18n.resolvedLanguage) ? i18n.resolvedLanguage : DEFAULT_LOCALE;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      void i18n.changeLanguage(next);
      storeLocale(next);
    },
    [i18n],
  );

  return { locale, setLocale };
}
