import { Locale } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { createI18n } from '@/shared/i18n/clients/i18n.client';

describe('createI18n', () => {
  it('formats a minute count as a readable duration', () => {
    const en = createI18n(Locale.En);
    const uk = createI18n(Locale.Uk);

    expect(en.t('flowBuilder:issue.INACTIVITY_AFTER_AUTO_CLOSE', { afterMinutes: 1440 })).toBe(
      'The conversation is closed after 1 day of silence, before this timer can finish firing',
    );
    expect(uk.t('flowBuilder:issue.INACTIVITY_AFTER_AUTO_CLOSE', { afterMinutes: 180 })).toContain(
      '(3 години)',
    );
  });
});
