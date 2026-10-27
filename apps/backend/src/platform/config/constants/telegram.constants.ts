export enum TelegramTransport {
  Webhook = 'webhook',
  Polling = 'polling',
}

export const TELEGRAM_POLL_TIMEOUT_DEFAULT_SECONDS = 20;
export const TELEGRAM_POLL_TIMEOUT_MAX_SECONDS = 50;
