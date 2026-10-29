import { describe, expect, it } from 'vitest';
import { TELEGRAM_CALLBACK_DATA_MAX_BYTES } from '@/modules/channels/constants/telegram.constants';
import {
  maskTelegramToken,
  telegramQuickReplyCallbackData,
  telegramReplyMarkup,
} from '@/modules/channels/helpers/telegram.helpers';

const MESSAGE_ID = '3f0c2a9e-6b7d-4c1a-9f2e-8d5b1a7c4e10';

describe('maskTelegramToken', () => {
  it('shows the first four bot id characters and the first three secret characters', () => {
    expect(maskTelegramToken('700000001:demo-salon-token')).toBe('7000•••••:dem•••••••••••••');
  });

  it('masks a token without a separator completely', () => {
    expect(maskTelegramToken('invalid')).toBe('•••••••');
  });
});

describe('telegramQuickReplyCallbackData', () => {
  it('encodes the message id and the quick reply index', () => {
    expect(telegramQuickReplyCallbackData(MESSAGE_ID, 2)).toBe(`qr:${MESSAGE_ID}:2`);
  });

  it('stays inside the telegram callback data limit', () => {
    const data = telegramQuickReplyCallbackData(MESSAGE_ID, 12);

    expect(new TextEncoder().encode(data).length).toBeLessThanOrEqual(
      TELEGRAM_CALLBACK_DATA_MAX_BYTES,
    );
  });
});

describe('telegramReplyMarkup', () => {
  it('makes one row per quick reply with an indexed callback', () => {
    expect(telegramReplyMarkup(MESSAGE_ID, ['Book', 'Call'])).toEqual({
      inline_keyboard: [
        [{ text: 'Book', callback_data: `qr:${MESSAGE_ID}:0` }],
        [{ text: 'Call', callback_data: `qr:${MESSAGE_ID}:1` }],
      ],
    });
  });

  it('keeps the stored index when a label is blank', () => {
    expect(telegramReplyMarkup(MESSAGE_ID, ['Book', '  ', 'Call'])).toEqual({
      inline_keyboard: [
        [{ text: 'Book', callback_data: `qr:${MESSAGE_ID}:0` }],
        [{ text: 'Call', callback_data: `qr:${MESSAGE_ID}:2` }],
      ],
    });
  });

  it('has no keyboard for no or blank quick replies', () => {
    expect(telegramReplyMarkup(MESSAGE_ID, [])).toBeNull();
    expect(telegramReplyMarkup(MESSAGE_ID, ['', '  '])).toBeNull();
  });
});
