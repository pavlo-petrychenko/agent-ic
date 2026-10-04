import { DEFAULT_LOCALE, Locale } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { negotiateLocale } from '@/platform/context/helpers/locale.helpers';

describe('negotiateLocale', () => {
  it('picks the supported language with the highest quality', () => {
    expect(negotiateLocale('de-DE,uk;q=0.9,en;q=0.8')).toBe(Locale.Uk);
  });

  it('matches a regional tag by its language', () => {
    expect(negotiateLocale('uk-UA')).toBe(Locale.Uk);
  });

  it('skips languages the client refuses', () => {
    expect(negotiateLocale('uk;q=0,en;q=0.5')).toBe(Locale.En);
  });

  it('falls back to the default locale', () => {
    expect(negotiateLocale(null)).toBe(DEFAULT_LOCALE);
    expect(negotiateLocale('fr-FR,de')).toBe(DEFAULT_LOCALE);
  });
});
