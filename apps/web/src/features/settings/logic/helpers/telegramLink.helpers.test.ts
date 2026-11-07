import { describe, expect, it } from 'vitest';
import {
  formatTelegramLinkCode,
  formatTelegramLinkedAt,
  telegramLinkMinutesLeft,
} from '@/features/settings/logic/helpers/telegramLink.helpers';

describe('telegramLinkMinutesLeft', () => {
  it('rounds up the remaining minutes', () => {
    const now = new Date('2026-11-07T10:00:00.000Z').getTime();
    expect(telegramLinkMinutesLeft('2026-11-07T10:09:10.000Z', now)).toBe(10);
  });

  it('never returns less than one minute', () => {
    const now = new Date('2026-11-07T10:00:00.000Z').getTime();
    expect(telegramLinkMinutesLeft('2026-11-07T09:59:00.000Z', now)).toBe(1);
  });
});

describe('formatTelegramLinkCode', () => {
  it('groups a six-digit code', () => {
    expect(formatTelegramLinkCode('482913')).toBe('482 913');
  });

  it('leaves another value alone', () => {
    expect(formatTelegramLinkCode('12345')).toBe('12345');
  });
});

describe('formatTelegramLinkedAt', () => {
  it('formats the month and day', () => {
    expect(formatTelegramLinkedAt('2026-09-20T10:00:00.000Z', 'en')).toBe('Sep 20');
  });
});
