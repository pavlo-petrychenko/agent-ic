import { describe, expect, it } from 'vitest';
import { TELEGRAM_CALLBACK_DATA_MAX_BYTES } from '@/modules/channels/constants/telegram.constants';
import {
  maskTelegramToken,
  telegramCallbackData,
  telegramReplyMarkup,
} from '@/modules/channels/helpers/telegram.helpers';

describe('maskTelegramToken', () => {
  it('shows the first four bot id characters and the first three secret characters', () => {
    expect(maskTelegramToken('700000001:demo-salon-token')).toBe('7000•••••:dem•••••••••••••');
  });

  it('masks a token without a separator completely', () => {
    expect(maskTelegramToken('invalid')).toBe('•••••••');
  });
});

describe('telegramCallbackData', () => {
  it('keeps a short label as it is', () => {
    expect(telegramCallbackData('Book a table')).toBe('Book a table');
  });

  it('cuts a long label to the callback data limit', () => {
    expect(telegramCallbackData('a'.repeat(70))).toBe('a'.repeat(TELEGRAM_CALLBACK_DATA_MAX_BYTES));
  });

  it('cuts a multibyte label without splitting a character', () => {
    const data = telegramCallbackData('ї'.repeat(40));

    expect(new TextEncoder().encode(data).length).toBe(TELEGRAM_CALLBACK_DATA_MAX_BYTES);
    expect(data).toBe('ї'.repeat(TELEGRAM_CALLBACK_DATA_MAX_BYTES / 2));
  });
});

describe('telegramReplyMarkup', () => {
  it('makes one row per quick reply', () => {
    expect(telegramReplyMarkup(['Book', 'Call'])).toEqual({
      inline_keyboard: [
        [{ text: 'Book', callback_data: 'Book' }],
        [{ text: 'Call', callback_data: 'Call' }],
      ],
    });
  });

  it('has no keyboard for no or blank quick replies', () => {
    expect(telegramReplyMarkup([])).toBeNull();
    expect(telegramReplyMarkup(['', '  '])).toBeNull();
  });
});
