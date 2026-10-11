import { describe, expect, it } from 'vitest';
import { Locale } from './vite.constants.ts';
import type { LandingEnv } from './vite.env.ts';
import {
  buildRedirects,
  escapeHtml,
  localeOfEntry,
  localeOfPath,
  MESSAGES,
  pageValues,
  renderTemplate,
} from './vite.render.ts';

const APP_URL = 'https://app.example';
const SITE_URL = 'https://site.example';
const ENV: LandingEnv = { LANDING_APP_URL: APP_URL, LANDING_SITE_URL: SITE_URL };
const YEAR = 2026;

const keysOf = (value: unknown, prefix = ''): string[] =>
  typeof value === 'object' && value !== null
    ? Object.entries(value).flatMap(([key, child]) => keysOf(child, `${prefix}${key}.`))
    : [prefix];

describe('renderTemplate', () => {
  it('fills placeholders from nested values and escapes them', () => {
    const html = renderTemplate('<p title="{{ a.b }}">{{a.c}}</p>', {
      a: { b: 'x "y"', c: '<b>&</b>' },
    });

    expect(html).toBe('<p title="x &quot;y&quot;">&lt;b&gt;&amp;&lt;/b&gt;</p>');
  });

  it('fails on a placeholder without text', () => {
    expect(() => renderTemplate('{{a.missing}}', { a: {} })).toThrow(/a\.missing/);
    expect(() => renderTemplate('{{a}}', { a: {} })).toThrow(/"a"/);
  });

  it('escapes every character that matters in HTML', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
});

describe('pageValues', () => {
  it('links the page to its alternates, the app and the contact address', () => {
    const values = pageValues(Locale.Uk, ENV, YEAR);
    const render = (path: string): string => renderTemplate(`{{${path}}}`, values);

    expect(render('page.url')).toBe(`${SITE_URL}/uk/`);
    expect(render('page.lang')).toBe(Locale.Uk);
    expect(render('alternate.en')).toBe(`${SITE_URL}/`);
    expect(render('current.uk')).toBe('page');
    expect(render('current.en')).toBe('false');
    expect(render('link.signUp')).toBe(`${APP_URL}/auth/sign-up`);
    expect(render('link.login')).toBe(`${APP_URL}/auth/login`);
    expect(render('link.contact')).toBe('mailto:pavlo@pavlop.dev');
    expect(render('page.year')).toBe(String(YEAR));
  });
});

describe('locales', () => {
  it('have the same keys in every language', () => {
    expect(keysOf(MESSAGES[Locale.Uk])).toEqual(keysOf(MESSAGES[Locale.En]));
  });

  it('are picked by page path', () => {
    expect(localeOfPath('/uk')).toBe(Locale.Uk);
    expect(localeOfPath('/uk/?ref=x')).toBe(Locale.Uk);
    expect(localeOfPath('/uk/index.html')).toBe(Locale.Uk);
    expect(localeOfPath('/')).toBe(Locale.En);
    expect(localeOfPath('/assets/main.js')).toBeNull();
    expect(localeOfEntry('/index.html')).toBe(Locale.En);
  });
});

describe('buildRedirects', () => {
  it('sends app paths to the app with a permanent redirect', () => {
    expect(buildRedirects(APP_URL).split('\n')).toEqual([
      `/auth/* ${APP_URL}/auth/:splat 301`,
      `/w/* ${APP_URL}/w/:splat 301`,
      `/invite/* ${APP_URL}/invite/:splat 301`,
      '',
    ]);
  });
});
