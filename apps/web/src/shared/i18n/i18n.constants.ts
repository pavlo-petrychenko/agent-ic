export enum Locale {
  En = 'en',
  Uk = 'uk',
}

export enum Namespace {
  Common = 'common',
  Errors = 'errors',
}

export const DEFAULT_LOCALE = Locale.En;
export const LOCALE_STORAGE_KEY = 'agent-ic.locale';
export const LANGUAGE_TAG_SEPARATOR = '-';
