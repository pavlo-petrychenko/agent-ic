import { describe, expect, it } from 'vitest';
import { TelegramApiError } from '@/modules/channels/errors/telegram-api.error';
import { isTelegramTokenInvalid } from '@/modules/channels/helpers/telegram-error.helpers';

describe('isTelegramTokenInvalid', () => {
  it('is true for 401 and 404', () => {
    expect(
      isTelegramTokenInvalid(new TelegramApiError({ method: 'sendMessage', status: 401 })),
    ).toBe(true);
    expect(isTelegramTokenInvalid(new TelegramApiError({ method: 'getMe', status: 404 }))).toBe(
      true,
    );
  });

  it('is false for other Telegram errors', () => {
    expect(
      isTelegramTokenInvalid(new TelegramApiError({ method: 'sendMessage', status: 403 })),
    ).toBe(false);
    expect(
      isTelegramTokenInvalid(new TelegramApiError({ method: 'getUpdates', status: 429 })),
    ).toBe(false);
    expect(
      isTelegramTokenInvalid(new TelegramApiError({ method: 'sendMessage', status: null })),
    ).toBe(false);
  });

  it('is false for other errors and non-errors', () => {
    expect(isTelegramTokenInvalid(new Error('boom'))).toBe(false);
    expect(isTelegramTokenInvalid(null)).toBe(false);
  });
});
