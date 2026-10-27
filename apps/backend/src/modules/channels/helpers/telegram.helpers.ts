import {
  TELEGRAM_TOKEN_MASK_CHARACTER,
  TELEGRAM_TOKEN_SEPARATOR,
  TELEGRAM_TOKEN_VISIBLE_BOT_ID_LENGTH,
  TELEGRAM_TOKEN_VISIBLE_SECRET_LENGTH,
  TELEGRAM_WEBHOOK_PATH,
} from '@/modules/channels/constants/telegram.constants';

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
