import { describe, expect, it } from 'vitest';
import { TELEGRAM_CALLBACK_DATA_MAX_BYTES } from '@/modules/channels/constants/telegram.constants';
import {
  maskTelegramToken,
  parseTelegramQuickReplyCallbackData,
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

describe('parseTelegramQuickReplyCallbackData', () => {
  it('reads the message id and index back', () => {
    expect(
      parseTelegramQuickReplyCallbackData(telegramQuickReplyCallbackData(MESSAGE_ID, 1)),
    ).toEqual({ messageId: MESSAGE_ID, index: 1 });
  });

  it('refuses data that is not a quick reply callback', () => {
    expect(parseTelegramQuickReplyCallbackData('')).toBeNull();
    expect(parseTelegramQuickReplyCallbackData('Book a table')).toBeNull();
    expect(parseTelegramQuickReplyCallbackData(`other:${MESSAGE_ID}:0`)).toBeNull();
    expect(parseTelegramQuickReplyCallbackData(`qr::0`)).toBeNull();
    expect(parseTelegramQuickReplyCallbackData(`qr:${MESSAGE_ID}`)).toBeNull();
    expect(parseTelegramQuickReplyCallbackData(`qr:${MESSAGE_ID}:`)).toBeNull();
    expect(parseTelegramQuickReplyCallbackData(`qr:${MESSAGE_ID}:one`)).toBeNull();
    expect(parseTelegramQuickReplyCallbackData(`qr:${MESSAGE_ID}:1.5`)).toBeNull();
    expect(parseTelegramQuickReplyCallbackData(`qr:${MESSAGE_ID}:0:extra`)).toBeNull();
  });
});

describe('telegramReplyMarkup', () => {
  it('packs short quick replies into one row', () => {
    expect(telegramReplyMarkup(MESSAGE_ID, ['Book', 'Call'])).toEqual({
      inline_keyboard: [
        [
          { text: 'Book', callback_data: `qr:${MESSAGE_ID}:0` },
          { text: 'Call', callback_data: `qr:${MESSAGE_ID}:1` },
        ],
      ],
    });
  });

  it('packs the three menu buttons into one row', () => {
    expect(telegramReplyMarkup(MESSAGE_ID, ['Menu', 'Hours', 'Talk to a person'])).toEqual({
      inline_keyboard: [
        [
          { text: 'Menu', callback_data: `qr:${MESSAGE_ID}:0` },
          { text: 'Hours', callback_data: `qr:${MESSAGE_ID}:1` },
          { text: 'Talk to a person', callback_data: `qr:${MESSAGE_ID}:2` },
        ],
      ],
    });
  });

  it('starts a new row when the labels no longer fit', () => {
    expect(telegramReplyMarkup(MESSAGE_ID, ['Book a table', 'Call us', 'Opening hours'])).toEqual({
      inline_keyboard: [
        [
          { text: 'Book a table', callback_data: `qr:${MESSAGE_ID}:0` },
          { text: 'Call us', callback_data: `qr:${MESSAGE_ID}:1` },
        ],
        [{ text: 'Opening hours', callback_data: `qr:${MESSAGE_ID}:2` }],
      ],
    });
  });

  it('puts a fourth button on the next row', () => {
    expect(telegramReplyMarkup(MESSAGE_ID, ['A', 'B', 'C', 'D'])).toEqual({
      inline_keyboard: [
        [
          { text: 'A', callback_data: `qr:${MESSAGE_ID}:0` },
          { text: 'B', callback_data: `qr:${MESSAGE_ID}:1` },
          { text: 'C', callback_data: `qr:${MESSAGE_ID}:2` },
        ],
        [{ text: 'D', callback_data: `qr:${MESSAGE_ID}:3` }],
      ],
    });
  });

  it('keeps the stored index when a label is blank', () => {
    expect(telegramReplyMarkup(MESSAGE_ID, ['Book', '  ', 'Call'])).toEqual({
      inline_keyboard: [
        [
          { text: 'Book', callback_data: `qr:${MESSAGE_ID}:0` },
          { text: 'Call', callback_data: `qr:${MESSAGE_ID}:2` },
        ],
      ],
    });
  });

  it('has no keyboard for no or blank quick replies', () => {
    expect(telegramReplyMarkup(MESSAGE_ID, [])).toBeNull();
    expect(telegramReplyMarkup(MESSAGE_ID, ['', '  '])).toBeNull();
  });
});
