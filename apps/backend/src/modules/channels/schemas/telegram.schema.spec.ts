import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { telegramWebhookUpdateSchema } from '@/modules/channels/schemas/telegram.schema';

describe('telegramWebhookUpdateSchema', () => {
  it('accepts a callback query update', () => {
    const update = telegramWebhookUpdateSchema.parse({
      update_id: 20,
      callback_query: {
        id: 'callback-1',
        from: { id: 900, first_name: 'Moshe' },
        message: { message_id: 5, date: 1_760_000_000, chat: { id: 42 } },
        data: 'qr:msg_1:0',
      },
    });

    expect(update.callback_query).toMatchObject({
      id: 'callback-1',
      data: 'qr:msg_1:0',
    });
  });

  it('accepts a message update without a callback query', () => {
    const update = telegramWebhookUpdateSchema.parse({
      update_id: 21,
      message: {
        message_id: 6,
        date: 1_760_000_000,
        text: 'Hello',
        chat: { id: 42 },
      },
    });

    expect(update.callback_query).toBeUndefined();
  });

  it('rejects a callback query without an id', () => {
    expect(() =>
      telegramWebhookUpdateSchema.parse({
        update_id: 22,
        callback_query: {
          from: { id: 900, first_name: 'Moshe' },
          data: 'qr:msg_1:0',
        },
      }),
    ).toThrow(ZodError);
  });

  it('rejects a callback query without a sender', () => {
    expect(() =>
      telegramWebhookUpdateSchema.parse({
        update_id: 23,
        callback_query: { id: 'callback-3', data: 'qr:msg_1:0' },
      }),
    ).toThrow(ZodError);
  });
});
