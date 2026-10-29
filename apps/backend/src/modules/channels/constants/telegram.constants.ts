export const TELEGRAM_API_BASE_URL = 'https://api.telegram.org';
export const TELEGRAM_API_TIMEOUT_MS = 10_000;
export const TELEGRAM_CONTENT_TYPE = 'application/json';
export const TELEGRAM_UPSTREAM = 'telegram-bot-api';
export const TELEGRAM_DROP_PENDING_UPDATES = true;
export const TELEGRAM_INVALID_RESPONSE_MESSAGE = 'Telegram returned an invalid response.';
export const TELEGRAM_TOKEN_PATTERN = /^\d+:[A-Za-z0-9_-]{35}$/;
export const TELEGRAM_TOKEN_SEPARATOR = ':';
export const TELEGRAM_TOKEN_VISIBLE_BOT_ID_LENGTH = 4;
export const TELEGRAM_TOKEN_VISIBLE_SECRET_LENGTH = 3;
export const TELEGRAM_TOKEN_MASK_CHARACTER = '•';
export const TELEGRAM_WEBHOOK_PATH = '/webhooks/telegram';
export const TELEGRAM_WEBHOOK_WORKSPACE_PARAM = 'workspaceId';
export const TELEGRAM_WEBHOOK_CHANNEL_PARAM = 'channelId';
export const TELEGRAM_CALLBACK_DATA_MAX_BYTES = 64;

export enum TelegramChatAction {
  Typing = 'typing',
}

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
