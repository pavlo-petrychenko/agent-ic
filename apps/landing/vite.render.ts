import { join } from 'node:path';
import en from './src/locales/en.json' with { type: 'json' };
import uk from './src/locales/uk.json' with { type: 'json' };
import {
  APP_REDIRECT_PREFIXES,
  AppPath,
  DEFAULT_LOCALE,
  HTML_ESCAPE_PATTERN,
  HTML_ESCAPES,
  LINE_BREAK,
  Locale,
  LOCALE_PATHS,
  PATH_SEPARATOR,
  PLACEHOLDER_PATTERN,
  QUERY_SEPARATOR,
  REDIRECT_STATUS,
  TEMPLATE_FILE,
  URL_SEPARATOR,
} from './vite.constants.ts';
import type { LandingEnv } from './vite.env.ts';

export type TemplateValue = string | { readonly [key: string]: TemplateValue };

export const MESSAGES: Readonly<Record<Locale, typeof en>> = {
  [Locale.En]: en,
  [Locale.Uk]: uk,
};

const LOCALES: readonly Locale[] = Object.values(Locale);

enum AriaCurrent {
  Page = 'page',
  None = 'false',
}

const perLocale = (value: (locale: Locale) => string): Record<string, string> =>
  Object.fromEntries(LOCALES.map((locale) => [locale, value(locale)]));

export const escapeHtml = (value: string): string =>
  value.replace(HTML_ESCAPE_PATTERN, (character) => HTML_ESCAPES[character] ?? character);

const lookup = (values: TemplateValue, path: string): string => {
  const found = path
    .split(PATH_SEPARATOR)
    .reduce<TemplateValue | undefined>(
      (node, key) => (typeof node === 'object' ? node[key] : undefined),
      values,
    );
  if (typeof found !== 'string') {
    throw new Error(`The landing template uses "${path}", which has no text`);
  }
  return found;
};

export const renderTemplate = (template: string, values: TemplateValue): string =>
  template.replace(PLACEHOLDER_PATTERN, (_match, path: string) => escapeHtml(lookup(values, path)));

export const pageUrl = (env: LandingEnv, locale: Locale): string =>
  `${env.LANDING_SITE_URL}${LOCALE_PATHS[locale]}`;

export const pageValues = (locale: Locale, env: LandingEnv): TemplateValue => ({
  t: MESSAGES[locale],
  page: { lang: locale, url: pageUrl(env, locale), path: LOCALE_PATHS[locale] },
  alternate: perLocale((other) => pageUrl(env, other)),
  path: perLocale((other) => LOCALE_PATHS[other]),
  current: perLocale((other) => (other === locale ? AriaCurrent.Page : AriaCurrent.None)),
  link: {
    signUp: `${env.LANDING_APP_URL}${AppPath.SignUp}`,
    login: `${env.LANDING_APP_URL}${AppPath.Login}`,
  },
});

export const pageEntryPath = (locale: Locale): string => `${LOCALE_PATHS[locale]}${TEMPLATE_FILE}`;

export const pageEntries = (root: string): Record<string, string> =>
  perLocale((locale) => join(root, pageEntryPath(locale)));

const directoryOf = (path: string): string => {
  const [pathname = ''] = path.split(QUERY_SEPARATOR);
  const directory = pathname.endsWith(TEMPLATE_FILE)
    ? pathname.slice(0, -TEMPLATE_FILE.length)
    : pathname;
  return directory.endsWith(URL_SEPARATOR) ? directory : `${directory}${URL_SEPARATOR}`;
};

export const localeOfPath = (path: string): Locale | null =>
  LOCALES.find((locale) => LOCALE_PATHS[locale] === directoryOf(path)) ?? null;

export const localeOfEntry = (path: string): Locale => localeOfPath(path) ?? DEFAULT_LOCALE;

export const buildRedirects = (appUrl: string): string =>
  APP_REDIRECT_PREFIXES.map(
    (prefix) => `${prefix}/* ${appUrl}${prefix}/:splat ${REDIRECT_STATUS}${LINE_BREAK}`,
  ).join('');
