import {
  API_HREF_SUFFIX,
  CHANNELS_HREF_PREFIX,
  CHANNELS_HREF_SUFFIX,
  TELEGRAM_HREF_SUFFIX,
  TELEGRAM_NEW_HREF_SUFFIX,
} from '@/features/channels/constants/route.constants';

export const channelsHref = (workspaceId: string): string =>
  `${CHANNELS_HREF_PREFIX}${encodeURIComponent(workspaceId)}${CHANNELS_HREF_SUFFIX}`;

export const telegramNewHref = (workspaceId: string): string =>
  `${channelsHref(workspaceId)}${TELEGRAM_NEW_HREF_SUFFIX}`;

export const telegramBotHref = (workspaceId: string, botId: string): string =>
  `${channelsHref(workspaceId)}${TELEGRAM_HREF_SUFFIX}${encodeURIComponent(botId)}`;

export const telegramBotPrefix = (workspaceId: string): string =>
  `${channelsHref(workspaceId)}${TELEGRAM_HREF_SUFFIX}`;

export const apiChannelHref = (workspaceId: string, channelId: string): string =>
  `${channelsHref(workspaceId)}${API_HREF_SUFFIX}${encodeURIComponent(channelId)}`;

export const apiChannelPrefix = (workspaceId: string): string =>
  `${channelsHref(workspaceId)}${API_HREF_SUFFIX}`;
