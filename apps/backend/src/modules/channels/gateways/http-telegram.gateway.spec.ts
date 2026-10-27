import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TELEGRAM_ALLOWED_UPDATES,
  TELEGRAM_API_BASE_URL,
  TELEGRAM_INVALID_RESPONSE_MESSAGE,
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
      },
      { updateId: '11', message: null },
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
