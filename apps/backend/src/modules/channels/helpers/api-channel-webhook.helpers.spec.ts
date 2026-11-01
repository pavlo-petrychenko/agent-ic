import { describe, expect, it } from 'vitest';
import {
  apiChannelWebhookTimestamp,
  signApiChannelWebhook,
} from '@/modules/channels/helpers/api-channel-webhook.helpers';

const SECRET = 'whsec_test_secret';
const TIMESTAMP = '1793486726';
const BODY = '{"message":"Hello"}';
const SIGNATURE = 'sha256=70d7b5448e64cbd12c1e9a7a8567d076b08e1709f22d7d1900f110634720bddb';

describe('apiChannelWebhookTimestamp', () => {
  it('uses Unix seconds', () => {
    expect(apiChannelWebhookTimestamp(new Date('2026-11-01T12:00:00.000Z'))).toBe('1793534400');
  });
});

describe('signApiChannelWebhook', () => {
  it('signs the timestamp and raw body', () => {
    expect(signApiChannelWebhook(SECRET, TIMESTAMP, BODY)).toBe(SIGNATURE);
  });

  it('changes when the body changes', () => {
    expect(signApiChannelWebhook(SECRET, TIMESTAMP, `${BODY} `)).not.toBe(SIGNATURE);
  });
});
