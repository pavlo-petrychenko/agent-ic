import { createHmac } from 'node:crypto';
import {
  API_CHANNEL_WEBHOOK_SIGNATURE_ALGORITHM,
  API_CHANNEL_WEBHOOK_SIGNATURE_PREFIX,
  API_CHANNEL_WEBHOOK_TIMESTAMP_SEPARATOR,
} from '@/modules/channels/constants/api-channel-webhook.constants';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';

export const apiChannelWebhookTimestamp = (now: Date): string =>
  Math.floor(now.getTime() / MILLISECONDS_PER_SECOND).toString();

export const signApiChannelWebhook = (secret: string, timestamp: string, body: string): string =>
  `${API_CHANNEL_WEBHOOK_SIGNATURE_PREFIX}${createHmac(
    API_CHANNEL_WEBHOOK_SIGNATURE_ALGORITHM,
    secret,
  )
    .update(`${timestamp}${API_CHANNEL_WEBHOOK_TIMESTAMP_SEPARATOR}${body}`)
    .digest('hex')}`;
