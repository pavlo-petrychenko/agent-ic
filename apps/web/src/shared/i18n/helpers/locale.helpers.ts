import { DEFAULT_LOCALE, Locale } from '@agent-ic/contracts';
import { LANGUAGE_TAG_SEPARATOR } from '@/shared/i18n/constants/locale.constants';

const LOCALES: ReadonlySet<string> = new Set(Object.values(Locale));

export const isLocale = (value: string | null | undefined): value is Locale =>
  value !== null && value !== undefined && LOCALES.has(value);

const primaryLanguage = (tag: string): string => tag.split(LANGUAGE_TAG_SEPARATOR)[0] ?? tag;

export function resolveInitialLocale(stored: string | null, languages: readonly string[]): Locale {
  if (isLocale(stored)) {
    return stored;
  }
  const preferred = languages.map(primaryLanguage).find(isLocale);
  return preferred ?? DEFAULT_LOCALE;
}
