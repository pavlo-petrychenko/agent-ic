import { describe, expect, it } from 'vitest';

import { DEFAULT_LOCALE, Locale } from './context.constants';
import { negotiateLocale, readBearerToken } from './context.helpers';

describe('readBearerToken', () => {
  it('reads the token of a bearer authorization', () => {
    expect(readBearerToken('Bearer abc.def')).toBe('abc.def');
  });

  it('accepts the scheme in any case', () => {
    expect(readBearerToken('bearer abc')).toBe('abc');
  });

  it('ignores a missing header, another scheme or an empty token', () => {
    expect(readBearerToken(null)).toBeNull();
    expect(readBearerToken('Basic abc')).toBeNull();
    expect(readBearerToken('Bearer ')).toBeNull();
    expect(readBearerToken('Bearer')).toBeNull();
  });
});

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
