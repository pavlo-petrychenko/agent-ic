import { TELEGRAM_WEBHOOK_PATH } from '@/modules/channels/constants/telegram.constants';

export const telegramWebhookUrl = (
  publicUrl: string,
  workspacePublicId: string,
  channelPublicId: string,
): string =>
  new URL(`${TELEGRAM_WEBHOOK_PATH}/${workspacePublicId}/${channelPublicId}`, publicUrl).toString();
