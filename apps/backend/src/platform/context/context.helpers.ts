import {
  AUTHORIZATION_SEPARATOR,
  BEARER_SCHEME,
  DEFAULT_LOCALE,
  LANGUAGE_DEFAULT_QUALITY,
  LANGUAGE_LIST_SEPARATOR,
  LANGUAGE_PARAMETER_SEPARATOR,
  LANGUAGE_QUALITY_PREFIX,
  LANGUAGE_SUBTAG_SEPARATOR,
  Locale,
} from '@/platform/context/context.constants';
import type { LanguagePreference } from '@/platform/context/context.typedefs';

const SUPPORTED_LOCALES: ReadonlySet<string> = new Set(Object.values(Locale));

const isLocale = (language: string): language is Locale => SUPPORTED_LOCALES.has(language);

export const readBearerToken = (authorization: string | null): string | null => {
  if (authorization === null) {
    return null;
  }
  const separator = authorization.indexOf(AUTHORIZATION_SEPARATOR);
  const scheme = authorization.slice(0, separator).toLowerCase();
  const token = authorization.slice(separator + 1).trim();
  return separator > 0 && scheme === BEARER_SCHEME && token.length > 0 ? token : null;
};

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
