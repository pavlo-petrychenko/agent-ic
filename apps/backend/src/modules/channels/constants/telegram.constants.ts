export const TELEGRAM_API_BASE_URL = 'https://api.telegram.org';
export const TELEGRAM_API_TIMEOUT_MS = 10_000;
export const TELEGRAM_CONTENT_TYPE = 'application/json';
export const TELEGRAM_UPSTREAM = 'telegram-bot-api';
export const TELEGRAM_DROP_PENDING_UPDATES = true;
export const TELEGRAM_INVALID_RESPONSE_MESSAGE = 'Telegram returned an invalid response.';

export enum TelegramUpdateType {
  Message = 'message',
  CallbackQuery = 'callback_query',
  MyChatMember = 'my_chat_member',
}

export const TELEGRAM_ALLOWED_UPDATES: readonly TelegramUpdateType[] = [
  TelegramUpdateType.Message,
  TelegramUpdateType.CallbackQuery,
  TelegramUpdateType.MyChatMember,
];
