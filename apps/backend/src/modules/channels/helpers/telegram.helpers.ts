import {
  TELEGRAM_CALLBACK_DATA_SEPARATOR,
  TELEGRAM_INLINE_KEYBOARD_BUTTON_PADDING,
  TELEGRAM_INLINE_KEYBOARD_MAX_ROW_BUTTONS,
  TELEGRAM_INLINE_KEYBOARD_ROW_WIDTH,
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

const telegramButtonWidth = (label: string): number =>
  Array.from(label).length + TELEGRAM_INLINE_KEYBOARD_BUTTON_PADDING;

export const telegramReplyMarkup = (
  messageId: string,
  quickReplies: readonly string[],
): TelegramReplyMarkup | null => {
  const rows: TelegramInlineKeyboardButton[][] = [];
  let row: TelegramInlineKeyboardButton[] = [];
  let rowWidth = 0;

  const flush = (): void => {
    if (row.length > 0) {
      rows.push(row);
    }
    row = [];
    rowWidth = 0;
  };

  quickReplies.forEach((label, index) => {
    if (label.trim() === '') {
      return;
    }
    const width = telegramButtonWidth(label);
    if (
      row.length > 0 &&
      (row.length >= TELEGRAM_INLINE_KEYBOARD_MAX_ROW_BUTTONS ||
        rowWidth + width > TELEGRAM_INLINE_KEYBOARD_ROW_WIDTH)
    ) {
      flush();
    }
    row.push(telegramButton(messageId, index, label));
    rowWidth += width;
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
