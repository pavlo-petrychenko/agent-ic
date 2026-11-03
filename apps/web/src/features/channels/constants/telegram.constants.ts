import { TelegramChannelStatus } from '@/features/channels/typedefs/telegram.typedefs';
import { ChannelStatus as ApiChannelStatus } from '@/shared/api/generated/schema.generated';

export const TELEGRAM_TOKEN_PATTERN = /^\d+:[A-Za-z0-9_-]{35}$/;

export const TELEGRAM_TOKEN_MASK = '••••••••:••••••••••••••••••••';

export const TELEGRAM_STATUS: Readonly<Record<ApiChannelStatus, TelegramChannelStatus>> = {
  [ApiChannelStatus.Pending]: TelegramChannelStatus.Pending,
  [ApiChannelStatus.Connected]: TelegramChannelStatus.Connected,
  [ApiChannelStatus.Broken]: TelegramChannelStatus.Broken,
  [ApiChannelStatus.Disconnected]: TelegramChannelStatus.Disconnected,
};
