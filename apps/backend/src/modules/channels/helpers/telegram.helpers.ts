import {
  TELEGRAM_CALLBACK_DATA_SEPARATOR,
  TELEGRAM_INLINE_KEYBOARD_COLUMNS,
  TELEGRAM_INLINE_KEYBOARD_MAX_COLUMN_LABEL_LENGTH,
  TELEGRAM_QUICK_REPLY_CALLBACK_PREFIX,
  TELEGRAM_QUICK_REPLY_INDEX_PATTERN,
  TELEGRAM_TOKEN_MASK_CHARACTER,
  TELEGRAM_TOKEN_SEPARATOR,
  TELEGRAM_TOKEN_VISIBLE_BOT_ID_LENGTH,
  TELEGRAM_TOKEN_VISIBLE_SECRET_LENGTH,
  TELEGRAM_WEBHOOK_PATH,
} from '@/modules/channels/constants/telegram.constants';
import type {
  TelegramInlineKeyboardButton,
  TelegramQuickReplyCallback,
  TelegramReplyMarkup,
} from '@/modules/channels/typedefs/telegram.typedefs';

export const telegramQuickReplyCallbackData = (messageId: string, index: number): string =>
  [TELEGRAM_QUICK_REPLY_CALLBACK_PREFIX, messageId, String(index)].join(
    TELEGRAM_CALLBACK_DATA_SEPARATOR,
  );

export const parseTelegramQuickReplyCallbackData = (
  data: string,
): TelegramQuickReplyCallback | null => {
  const [prefix, messageId, index, ...rest] = data.split(TELEGRAM_CALLBACK_DATA_SEPARATOR);
  if (
    prefix !== TELEGRAM_QUICK_REPLY_CALLBACK_PREFIX ||
    messageId === undefined ||
    messageId === '' ||
    index === undefined ||
    rest.length > 0 ||
    !TELEGRAM_QUICK_REPLY_INDEX_PATTERN.test(index)
  ) {
    return null;
  }
  return { messageId, index: Number(index) };
};

const telegramButton = (
  messageId: string,
  index: number,
  label: string,
): TelegramInlineKeyboardButton => ({
  text: label,
  callback_data: telegramQuickReplyCallbackData(messageId, index),
});

const telegramFitsColumn = (label: string): boolean =>
  Array.from(label).length <= TELEGRAM_INLINE_KEYBOARD_MAX_COLUMN_LABEL_LENGTH;

export const telegramReplyMarkup = (
  messageId: string,
  quickReplies: readonly string[],
): TelegramReplyMarkup | null => {
  const rows: TelegramInlineKeyboardButton[][] = [];
  let row: TelegramInlineKeyboardButton[] = [];

  const flush = (): void => {
    if (row.length > 0) {
      rows.push(row);
    }
    row = [];
  };

  quickReplies.forEach((label, index) => {
    if (label.trim() === '') {
      return;
    }
    const fitsColumn = telegramFitsColumn(label);
    if (row.length === 1 && !fitsColumn) {
      flush();
    }
    row.push(telegramButton(messageId, index, label));
    if (!fitsColumn || row.length >= TELEGRAM_INLINE_KEYBOARD_COLUMNS) {
      flush();
    }
  });

  flush();
  return rows.length === 0 ? null : { inline_keyboard: rows };
};

export const telegramWebhookUrl = (
  publicUrl: string,
  workspacePublicId: string,
  channelPublicId: string,
): string =>
  new URL(`${TELEGRAM_WEBHOOK_PATH}/${workspacePublicId}/${channelPublicId}`, publicUrl).toString();

const maskedPart = (value: string, visibleLength: number): string =>
  value.slice(0, visibleLength) +
  TELEGRAM_TOKEN_MASK_CHARACTER.repeat(Math.max(value.length - visibleLength, 0));

export const maskTelegramToken = (token: string): string => {
  const separator = token.indexOf(TELEGRAM_TOKEN_SEPARATOR);
  if (separator === -1) {
    return TELEGRAM_TOKEN_MASK_CHARACTER.repeat(token.length);
  }
  return [
    maskedPart(token.slice(0, separator), TELEGRAM_TOKEN_VISIBLE_BOT_ID_LENGTH),
    maskedPart(token.slice(separator + 1), TELEGRAM_TOKEN_VISIBLE_SECRET_LENGTH),
  ].join(TELEGRAM_TOKEN_SEPARATOR);
};
