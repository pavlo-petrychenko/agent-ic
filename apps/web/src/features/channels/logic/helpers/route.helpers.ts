import {
  CHANNELS_PATH,
  CHANNELS_TELEGRAM_BOT_PATH,
  CHANNELS_TELEGRAM_NEW_PATH,
} from '@/features/channels/constants/route.constants';

export const channelsHref = (workspaceId: string): string =>
  CHANNELS_PATH.replace('$workspaceId', encodeURIComponent(workspaceId));

export const telegramNewHref = (workspaceId: string): string =>
  CHANNELS_TELEGRAM_NEW_PATH.replace('$workspaceId', encodeURIComponent(workspaceId));

export const telegramBotHref = (workspaceId: string, botId: string): string =>
  CHANNELS_TELEGRAM_BOT_PATH.replace('$workspaceId', encodeURIComponent(workspaceId)).replace(
    '$botId',
    encodeURIComponent(botId),
  );

export const telegramBotPrefix = (workspaceId: string): string =>
  CHANNELS_TELEGRAM_BOT_PATH.replace('$workspaceId', encodeURIComponent(workspaceId)).replace(
    '$botId',
    '',
  );
