import {
  TELEGRAM_ALERT_CALLBACK_SEPARATOR,
  TELEGRAM_ALERT_CALLBACK_TAKE_OVER,
} from '@/modules/notifications/constants/notification.constants';

export interface TelegramTakeOverCallback {
  readonly workspacePublicId: string;
  readonly conversationPublicId: string;
}

export const telegramTakeOverCallbackData = (
  workspacePublicId: string,
  conversationPublicId: string,
): string =>
  [TELEGRAM_ALERT_CALLBACK_TAKE_OVER, workspacePublicId, conversationPublicId].join(
    TELEGRAM_ALERT_CALLBACK_SEPARATOR,
  );

export const parseTelegramTakeOverCallback = (
  data: string | null,
): TelegramTakeOverCallback | null => {
  if (data === null) {
    return null;
  }
  const [prefix, workspacePublicId, conversationPublicId, ...rest] = data.split(
    TELEGRAM_ALERT_CALLBACK_SEPARATOR,
  );
  if (
    prefix !== TELEGRAM_ALERT_CALLBACK_TAKE_OVER ||
    workspacePublicId === undefined ||
    conversationPublicId === undefined ||
    rest.length > 0
  ) {
    return null;
  }
  return { workspacePublicId, conversationPublicId };
};
