import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TELEGRAM_ALLOWED_UPDATES,
  TELEGRAM_API_BASE_URL,
  TELEGRAM_INVALID_RESPONSE_MESSAGE,
  TelegramChatAction,
} from '@/modules/channels/constants/telegram.constants';
import { TelegramApiError } from '@/modules/channels/errors/telegram-api.error';
import { HttpTelegramGateway } from '@/modules/channels/gateways/http-telegram.gateway';
import {
  TEST_TELEGRAM_BOT_ID,
  TEST_TELEGRAM_BOT_NAME,
  TEST_TELEGRAM_BOT_USERNAME,
  TEST_TELEGRAM_TOKEN,
  TEST_TELEGRAM_WEBHOOK_SECRET,
  TEST_TELEGRAM_WEBHOOK_URL,
} from '@test/support/constants/channel-testing.constants';

const BOT_RESPONSE = {
  ok: true,
  result: {
    id: Number(TEST_TELEGRAM_BOT_ID),
    is_bot: true,
    first_name: TEST_TELEGRAM_BOT_NAME,
    username: TEST_TELEGRAM_BOT_USERNAME,
  },
};

const requestBody = (init: RequestInit | undefined): unknown => {
  if (typeof init?.body !== 'string') {
    throw new TypeError('Expected a JSON string body');
  }
  return JSON.parse(init.body);
};

describe('HttpTelegramGateway', () => {
  let gateway: HttpTelegramGateway;
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    gateway = new HttpTelegramGateway();
    fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the bot behind the token', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(BOT_RESPONSE));

    await expect(gateway.getMe(TEST_TELEGRAM_TOKEN)).resolves.toEqual({
      id: TEST_TELEGRAM_BOT_ID,
      username: TEST_TELEGRAM_BOT_USERNAME,
      firstName: TEST_TELEGRAM_BOT_NAME,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `${TELEGRAM_API_BASE_URL}/bot${TEST_TELEGRAM_TOKEN}/getMe`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('registers the webhook with its secret and allowed updates', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true, result: true }));

    await gateway.setWebhook({
      token: TEST_TELEGRAM_TOKEN,
      url: TEST_TELEGRAM_WEBHOOK_URL,
      secret: TEST_TELEGRAM_WEBHOOK_SECRET,
      allowedUpdates: TELEGRAM_ALLOWED_UPDATES,
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${TELEGRAM_API_BASE_URL}/bot${TEST_TELEGRAM_TOKEN}/setWebhook`);
    expect(init?.method).toBe('POST');
    expect(requestBody(init)).toEqual({
      url: TEST_TELEGRAM_WEBHOOK_URL,
      secret_token: TEST_TELEGRAM_WEBHOOK_SECRET,
      allowed_updates: [...TELEGRAM_ALLOWED_UPDATES],
    });
  });

  it('removes the webhook and drops pending updates', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true, result: true }));

    await gateway.deleteWebhook(TEST_TELEGRAM_TOKEN);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${TELEGRAM_API_BASE_URL}/bot${TEST_TELEGRAM_TOKEN}/deleteWebhook`);
    expect(init?.method).toBe('POST');
    expect(requestBody(init)).toEqual({ drop_pending_updates: true });
  });

  it('reads the webhook status and its last error', async () => {
    const lastErrorDate = 1_760_000_000;
    fetchMock.mockResolvedValueOnce(
      Response.json({
        ok: true,
        result: {
          url: TEST_TELEGRAM_WEBHOOK_URL,
          pending_update_count: 2,
          last_error_date: lastErrorDate,
          last_error_message: 'Wrong response from the webhook: 404 Not Found',
        },
      }),
    );

    await expect(gateway.getWebhookInfo(TEST_TELEGRAM_TOKEN)).resolves.toEqual({
      url: TEST_TELEGRAM_WEBHOOK_URL,
      pendingUpdateCount: 2,
      lastErrorAt: new Date(lastErrorDate * 1_000),
      lastErrorMessage: 'Wrong response from the webhook: 404 Not Found',
    });
  });

  it('long-polls updates and maps the message fields', async () => {
    const sentAt = 1_760_000_000;
    fetchMock.mockResolvedValueOnce(
      Response.json({
        ok: true,
        result: [
          {
            update_id: 10,
            message: {
              message_id: 5,
              date: sentAt,
              text: 'Hello',
              chat: { id: 42 },
              from: { id: 900, first_name: 'Moshe' },
            },
          },
          { update_id: 11 },
        ],
      }),
    );

    await expect(
      gateway.getUpdates({
        token: TEST_TELEGRAM_TOKEN,
        offset: 10,
        timeoutSeconds: 20,
        allowedUpdates: TELEGRAM_ALLOWED_UPDATES,
      }),
    ).resolves.toEqual([
      {
        updateId: '10',
        message: {
          messageId: '5',
          sentAt: new Date(sentAt * 1_000),
          chatId: '42',
          senderId: '900',
          senderName: 'Moshe',
          text: 'Hello',
        },
        callbackQuery: null,
      },
      { updateId: '11', message: null, callbackQuery: null },
    ]);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${TELEGRAM_API_BASE_URL}/bot${TEST_TELEGRAM_TOKEN}/getUpdates`);
    expect(init?.method).toBe('POST');
    expect(requestBody(init)).toEqual({
      offset: 10,
      timeout: 20,
      allowed_updates: [...TELEGRAM_ALLOWED_UPDATES],
    });
  });

  it('maps a message without text or sender to nulls', async () => {
    const sentAt = 1_760_000_000;
    fetchMock.mockResolvedValueOnce(
      Response.json({
        ok: true,
        result: [{ update_id: 12, message: { message_id: 6, date: sentAt, chat: { id: 42 } } }],
      }),
    );

    await expect(
      gateway.getUpdates({
        token: TEST_TELEGRAM_TOKEN,
        offset: 0,
        timeoutSeconds: 20,
        allowedUpdates: TELEGRAM_ALLOWED_UPDATES,
      }),
    ).resolves.toEqual([
      {
        updateId: '12',
        message: {
          messageId: '6',
          sentAt: new Date(sentAt * 1_000),
          chatId: '42',
          senderId: null,
          senderName: null,
          text: null,
        },
        callbackQuery: null,
      },
    ]);
  });

  it('maps a callback query update', async () => {
    const sentAt = 1_760_000_000;
    fetchMock.mockResolvedValueOnce(
      Response.json({
        ok: true,
        result: [
          {
            update_id: 13,
            callback_query: {
              id: 'callback-1',
              from: { id: 900, first_name: 'Moshe' },
              message: {
                message_id: 7,
                date: sentAt,
                text: 'Choose',
                chat: { id: 42 },
              },
              data: 'qr:msg_1:0',
            },
          },
        ],
      }),
    );

    await expect(
      gateway.getUpdates({
        token: TEST_TELEGRAM_TOKEN,
        offset: 0,
        timeoutSeconds: 20,
        allowedUpdates: TELEGRAM_ALLOWED_UPDATES,
      }),
    ).resolves.toEqual([
      {
        updateId: '13',
        message: null,
        callbackQuery: {
          id: 'callback-1',
          chatId: '42',
          telegramMessageId: '7',
          senderId: '900',
          senderName: 'Moshe',
          data: 'qr:msg_1:0',
        },
      },
    ]);
  });

  it('returns no updates when telegram has none', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true, result: [] }));

    await expect(
      gateway.getUpdates({
        token: TEST_TELEGRAM_TOKEN,
        offset: 0,
        timeoutSeconds: 20,
        allowedUpdates: TELEGRAM_ALLOWED_UPDATES,
      }),
    ).resolves.toEqual([]);
  });

  it('sends a message with its quick replies as an inline keyboard', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        ok: true,
        result: { message_id: 7, date: 1_760_000_000, chat: { id: 42 }, text: 'Hello' },
      }),
    );

    await gateway.sendMessage({
      token: TEST_TELEGRAM_TOKEN,
      chatId: '42',
      messageId: 'message-1',
      text: 'Hello',
      quickReplies: ['Book a table', 'Call us'],
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${TELEGRAM_API_BASE_URL}/bot${TEST_TELEGRAM_TOKEN}/sendMessage`);
    expect(init?.method).toBe('POST');
    expect(requestBody(init)).toEqual({
      chat_id: '42',
      text: 'Hello',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Book a table', callback_data: 'qr:message-1:0' }],
          [{ text: 'Call us', callback_data: 'qr:message-1:1' }],
        ],
      },
    });
  });

  it('sends a message without a keyboard when it has no quick replies', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        ok: true,
        result: { message_id: 8, date: 1_760_000_000, chat: { id: 42 }, text: 'Hello' },
      }),
    );

    await gateway.sendMessage({
      token: TEST_TELEGRAM_TOKEN,
      chatId: '42',
      messageId: 'message-1',
      text: 'Hello',
      quickReplies: [],
    });

    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(requestBody(init)).toEqual({ chat_id: '42', text: 'Hello' });
  });

  it('sends a typing chat action', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true, result: true }));

    await gateway.sendChatAction({
      token: TEST_TELEGRAM_TOKEN,
      chatId: '42',
      action: TelegramChatAction.Typing,
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${TELEGRAM_API_BASE_URL}/bot${TEST_TELEGRAM_TOKEN}/sendChatAction`);
    expect(init?.method).toBe('POST');
    expect(requestBody(init)).toEqual({ chat_id: '42', action: 'typing' });
  });

  it('answers a callback query with an alert', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true, result: true }));

    await gateway.answerCallbackQuery({
      token: TEST_TELEGRAM_TOKEN,
      callbackQueryId: 'callback-1',
      text: 'This button is no longer active',
      showAlert: true,
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${TELEGRAM_API_BASE_URL}/bot${TEST_TELEGRAM_TOKEN}/answerCallbackQuery`);
    expect(init?.method).toBe('POST');
    expect(requestBody(init)).toEqual({
      callback_query_id: 'callback-1',
      text: 'This button is no longer active',
      show_alert: true,
    });
  });

  it('answers a callback query without text or an alert', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true, result: true }));

    await gateway.answerCallbackQuery({
      token: TEST_TELEGRAM_TOKEN,
      callbackQueryId: 'callback-2',
      text: null,
      showAlert: false,
    });

    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(requestBody(init)).toEqual({ callback_query_id: 'callback-2' });
  });

  it('maps a blocked bot to a non-retryable send error', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json(
        { ok: false, error_code: 403, description: 'Forbidden: bot was blocked by the user' },
        { status: 403 },
      ),
    );

    const error = await gateway
      .sendMessage({
        token: TEST_TELEGRAM_TOKEN,
        chatId: '42',
        messageId: 'message-1',
        text: 'Hello',
        quickReplies: [],
      })
      .catch((caught: unknown) => caught);

    if (!(error instanceof TelegramApiError)) {
      throw error;
    }
    expect(error).toMatchObject({
      method: 'sendMessage',
      status: 403,
      retryable: false,
      description: 'Forbidden: bot was blocked by the user',
    });
  });

  it('maps a rate limit on getUpdates to a retryable error', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json(
        {
          ok: false,
          error_code: 429,
          description: 'Too Many Requests',
          parameters: { retry_after: 3 },
        },
        { status: 429 },
      ),
    );

    const error = await gateway
      .getUpdates({
        token: TEST_TELEGRAM_TOKEN,
        offset: 0,
        timeoutSeconds: 20,
        allowedUpdates: TELEGRAM_ALLOWED_UPDATES,
      })
      .catch((caught: unknown) => caught);

    if (!(error instanceof TelegramApiError)) {
      throw error;
    }
    expect(error).toMatchObject({
      method: 'getUpdates',
      status: 429,
      retryable: true,
      retryAfterSeconds: 3,
    });
  });

  it('maps an invalid token to a non-retryable error without leaking it', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ ok: false, error_code: 401, description: 'Unauthorized' }, { status: 401 }),
    );

    const error = await gateway.getMe(TEST_TELEGRAM_TOKEN).catch((caught: unknown) => caught);

    if (!(error instanceof TelegramApiError)) {
      throw error;
    }
    expect(error).toMatchObject({
      method: 'getMe',
      status: 401,
      retryable: false,
      description: 'Unauthorized',
    });
    expect(error.message).not.toContain(TEST_TELEGRAM_TOKEN);
  });

  it('rejects a success response without a result', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true }));

    const error = await gateway.getMe(TEST_TELEGRAM_TOKEN).catch((caught: unknown) => caught);

    if (!(error instanceof TelegramApiError)) {
      throw error;
    }
    expect(error).toMatchObject({
      method: 'getMe',
      status: null,
      retryable: false,
      description: TELEGRAM_INVALID_RESPONSE_MESSAGE,
    });
  });

  it('maps a rate limit to a retryable error with its delay', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json(
        {
          ok: false,
          error_code: 429,
          description: 'Too Many Requests',
          parameters: { retry_after: 7 },
        },
        { status: 429 },
      ),
    );

    const error = await gateway
      .setWebhook({
        token: TEST_TELEGRAM_TOKEN,
        url: TEST_TELEGRAM_WEBHOOK_URL,
        secret: TEST_TELEGRAM_WEBHOOK_SECRET,
        allowedUpdates: TELEGRAM_ALLOWED_UPDATES,
      })
      .catch((caught: unknown) => caught);

    if (!(error instanceof TelegramApiError)) {
      throw error;
    }
    expect(error).toMatchObject({
      method: 'setWebhook',
      status: 429,
      retryable: true,
      retryAfterSeconds: 7,
    });
  });

  it('maps a network failure to a retryable error without leaking the token', async () => {
    fetchMock.mockRejectedValueOnce(new Error(`request failed for ${TEST_TELEGRAM_TOKEN}`));

    const error = await gateway.getMe(TEST_TELEGRAM_TOKEN).catch((caught: unknown) => caught);

    if (!(error instanceof TelegramApiError)) {
      throw error;
    }
    expect(error).toMatchObject({ method: 'getMe', status: null, retryable: true });
    expect(error.message).not.toContain(TEST_TELEGRAM_TOKEN);
  });
});
