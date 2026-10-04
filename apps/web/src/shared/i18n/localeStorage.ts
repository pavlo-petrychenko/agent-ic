import type { Locale } from '@agent-ic/contracts';
import { LOCALE_STORAGE_KEY } from '@/shared/i18n/i18n.constants';

export const readStoredLocale = (): string | null => {
  try {
    return window.localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const storeLocale = (locale: Locale): void => {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    return;
  }
};
