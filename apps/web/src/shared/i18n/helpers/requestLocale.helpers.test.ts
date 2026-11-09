import { DEFAULT_LOCALE, Locale } from '@agent-ic/contracts';
import { afterEach, describe, expect, it } from 'vitest';
import { getRequestContext, setRequestLocale } from '@/shared/api/helpers/requestContext.helpers';
import { createI18n } from '@/shared/i18n/clients/i18n.client';
import { bindRequestLocale } from '@/shared/i18n/helpers/requestLocale.helpers';

describe('bindRequestLocale', () => {
  afterEach(() => setRequestLocale(DEFAULT_LOCALE));

  it('starts from the language the app opened in', () => {
    bindRequestLocale(createI18n(Locale.Uk));

    expect(getRequestContext().locale).toBe(Locale.Uk);
  });

  it('follows the language switch', async () => {
    const i18n = createI18n(Locale.En);
    bindRequestLocale(i18n);

    await i18n.changeLanguage(Locale.Uk);

    expect(getRequestContext().locale).toBe(Locale.Uk);
  });

  it('stops following once released', async () => {
    const i18n = createI18n(Locale.En);
    const release = bindRequestLocale(i18n);
    release();

    await i18n.changeLanguage(Locale.Uk);

    expect(getRequestContext().locale).toBe(Locale.En);
  });
});
