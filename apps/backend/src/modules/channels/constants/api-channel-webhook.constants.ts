export enum ApiChannelWebhookHeader {
  Signature = 'X-Agent-IC-Signature',
  Timestamp = 'X-Agent-IC-Timestamp',
  Delivery = 'X-Agent-IC-Delivery',
}

export const API_CHANNEL_WEBHOOK_SIGNATURE_ALGORITHM = 'sha256';
export const API_CHANNEL_WEBHOOK_SIGNATURE_PREFIX = `${API_CHANNEL_WEBHOOK_SIGNATURE_ALGORITHM}=`;
export const API_CHANNEL_WEBHOOK_TIMESTAMP_SEPARATOR = '.';
export const API_CHANNEL_WEBHOOK_TIMEOUT_MS = 10_000;
export const API_CHANNEL_WEBHOOK_UPSTREAM = 'api-channel-webhook';
