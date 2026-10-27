import { TELEGRAM_STATUS } from '@/features/channels/constants/telegram.constants';
import type {
  ChannelAgent,
  ChannelSummary,
  ChannelDetail,
} from '@/features/channels/typedefs/channels.typedefs';
import {
  type TelegramChannelSummary,
  type TelegramChannelView,
} from '@/features/channels/typedefs/telegram.typedefs';
import { ChannelKind as ApiChannelKind } from '@/shared/api/generated/schema.generated';

export const isTelegramChannel = (channel: { readonly kind: ApiChannelKind }): boolean =>
  channel.kind === ApiChannelKind.Telegram;

const telegramHandle = (username: string): string =>
  username.startsWith('@') ? username : `@${username}`;

export const toTelegramChannelSummary = (
  channel: ChannelSummary,
  agentName: string | null,
): TelegramChannelSummary => ({
  id: channel.id,
  displayName: telegramHandle(channel.displayName),
  status: TELEGRAM_STATUS[channel.status],
  agentId: channel.agentId,
  agentName,
});

export const toTelegramChannelView = (
  channel: ChannelDetail,
  agent: ChannelAgent | null,
): TelegramChannelView => ({
  ...toTelegramChannelSummary(channel, agent?.name ?? null),
  firstName: channel.firstName,
  tokenMasked: channel.tokenMasked,
  agentLiveVersionNumber: agent?.liveVersionNumber ?? null,
  showTyping: channel.showTyping,
  updatedAt: channel.updatedAt,
});
