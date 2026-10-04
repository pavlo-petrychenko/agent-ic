import { DEFAULT_LOCALE, Locale } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { resolveInitialLocale } from '@/shared/i18n/i18n.helpers';

describe('resolveInitialLocale', () => {
  it('prefers the stored choice over the browser languages', () => {
    expect(resolveInitialLocale(Locale.Uk, ['en-US'])).toBe(Locale.Uk);
  });

  it('ignores a stored value that is not a supported locale', () => {
    expect(resolveInitialLocale('fr', ['uk-UA'])).toBe(Locale.Uk);
  });

  it('picks the first supported browser language, matching on the language part', () => {
    expect(resolveInitialLocale(null, ['de-DE', 'uk-UA', 'en-GB'])).toBe(Locale.Uk);
  });

  it('falls back to the default when nothing matches', () => {
    expect(resolveInitialLocale(null, ['de-DE', 'fr'])).toBe(DEFAULT_LOCALE);
    expect(resolveInitialLocale(null, [])).toBe(DEFAULT_LOCALE);
  });
});
