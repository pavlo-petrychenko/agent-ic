import { ATTR_URL_FULL, ATTR_URL_PATH } from '@opentelemetry/semantic-conventions';
import { describe, expect, it } from 'vitest';
import { BOT_TOKEN_PATH_MASK } from '@/platform/observability/constants/tracing.constants';
import { maskBotTokenUrl } from '@/platform/observability/helpers/instrumentation.helpers';

const TELEGRAM_ORIGIN = 'https://api.telegram.org';

const BOT_TOKEN = '123456:secret-token';

describe('maskBotTokenUrl', () => {
  it('masks the bot token in the url attributes', () => {
    const attributes = maskBotTokenUrl({
      origin: TELEGRAM_ORIGIN,
      path: `/bot${BOT_TOKEN}/sendMessage`,
    });

    expect(attributes).toEqual({
      [ATTR_URL_FULL]: `${TELEGRAM_ORIGIN}${BOT_TOKEN_PATH_MASK}/sendMessage`,
      [ATTR_URL_PATH]: `${BOT_TOKEN_PATH_MASK}/sendMessage`,
    });
    expect(JSON.stringify(attributes)).not.toContain(BOT_TOKEN);
  });

  it('keeps the attributes of a request without a bot token', () => {
    expect(maskBotTokenUrl({ origin: TELEGRAM_ORIGIN, path: '/v1/chat/completions' })).toEqual({});
  });
});
