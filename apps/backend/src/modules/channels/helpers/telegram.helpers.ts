import {
  TELEGRAM_CALLBACK_DATA_MAX_BYTES,
  TELEGRAM_TOKEN_MASK_CHARACTER,
  TELEGRAM_TOKEN_SEPARATOR,
  TELEGRAM_TOKEN_VISIBLE_BOT_ID_LENGTH,
  TELEGRAM_TOKEN_VISIBLE_SECRET_LENGTH,
  TELEGRAM_WEBHOOK_PATH,
} from '@/modules/channels/constants/telegram.constants';
import type {
  TelegramInlineKeyboardButton,
  TelegramReplyMarkup,
} from '@/modules/channels/typedefs/telegram.typedefs';

const callbackDataEncoder = new TextEncoder();

export const telegramCallbackData = (label: string): string => {
  if (callbackDataEncoder.encode(label).length <= TELEGRAM_CALLBACK_DATA_MAX_BYTES) {
    return label;
  }
  let data = '';
  for (const character of label) {
    if (callbackDataEncoder.encode(data + character).length > TELEGRAM_CALLBACK_DATA_MAX_BYTES) {
      break;
    }
    data += character;
  }
  return data;
};

const telegramButton = (label: string): TelegramInlineKeyboardButton => ({
  text: label,
  callback_data: telegramCallbackData(label),
});

export const telegramReplyMarkup = (
  quickReplies: readonly string[],
): TelegramReplyMarkup | null => {
  const buttons = quickReplies.filter((label) => label.trim() !== '');
  if (buttons.length === 0) {
    return null;
  }
  return { inline_keyboard: buttons.map((label) => [telegramButton(label)]) };
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
