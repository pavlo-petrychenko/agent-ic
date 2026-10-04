import { DEFAULT_LOCALE, Locale } from '@agent-ic/contracts';
import {
  LANGUAGE_DEFAULT_QUALITY,
  LANGUAGE_LIST_SEPARATOR,
  LANGUAGE_PARAMETER_SEPARATOR,
  LANGUAGE_QUALITY_PREFIX,
  LANGUAGE_SUBTAG_SEPARATOR,
} from '@/platform/context/constants/locale.constants';
import type { LanguagePreference } from '@/platform/context/typedefs/locale.typedefs';

const SUPPORTED_LOCALES: ReadonlySet<string> = new Set(Object.values(Locale));

const isLocale = (language: string): language is Locale => SUPPORTED_LOCALES.has(language);

const parseQuality = (parameters: readonly string[]): number => {
  const quality = parameters
    .map((parameter) => parameter.trim())
    .find((parameter) => parameter.startsWith(LANGUAGE_QUALITY_PREFIX));
  const value = Number(quality?.slice(LANGUAGE_QUALITY_PREFIX.length) ?? LANGUAGE_DEFAULT_QUALITY);
  return Number.isFinite(value) ? value : 0;
};

const parseLanguagePreference = (entry: string): LanguagePreference => {
  const [tag = '', ...parameters] = entry.split(LANGUAGE_PARAMETER_SEPARATOR);
  const [language = ''] = tag.trim().toLowerCase().split(LANGUAGE_SUBTAG_SEPARATOR);
  return { language, quality: parseQuality(parameters) };
};

export const negotiateLocale = (acceptLanguage: string | null): Locale =>
  (acceptLanguage ?? '')
    .split(LANGUAGE_LIST_SEPARATOR)
    .map(parseLanguagePreference)
    .filter((preference) => preference.quality > 0)
    .toSorted((first, second) => second.quality - first.quality)
    .map((preference) => preference.language)
    .find(isLocale) ?? DEFAULT_LOCALE;
