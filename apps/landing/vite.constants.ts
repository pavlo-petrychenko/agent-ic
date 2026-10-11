export enum Locale {
  En = 'en',
  Uk = 'uk',
}

export const DEFAULT_LOCALE = Locale.En;

export const LOCALE_PATHS: Readonly<Record<Locale, string>> = {
  [Locale.En]: '/',
  [Locale.Uk]: '/uk/',
};

export enum AppPath {
  SignUp = '/auth/sign-up',
  Login = '/auth/login',
}

export const CONTACT_EMAIL = 'pavlo@pavlop.dev';
export const MAILTO = 'mailto:';

export const APP_REDIRECT_PREFIXES: readonly string[] = ['/auth', '/w', '/invite'];
export const REDIRECT_STATUS = 301;
export const REDIRECTS_FILE = '_redirects';

export const ENV_PREFIX = 'LANDING_';
export const TEMPLATE_FILE = 'index.html';
export const PLUGIN_NAME = 'agent-ic:landing-pages';
export const CONTENT_TYPE_HEADER = 'Content-Type';
export const HTML_CONTENT_TYPE = 'text/html; charset=utf-8';
export const TRAILING_SLASHES = /\/+$/;
export const PLACEHOLDER_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;
export const PATH_SEPARATOR = '.';
export const URL_SEPARATOR = '/';
export const QUERY_SEPARATOR = '?';
export const LINE_BREAK = '\n';

export const HTML_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
export const HTML_ESCAPE_PATTERN = /[&<>"']/g;
