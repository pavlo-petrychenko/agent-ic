import { TelegramChannelStatus } from '@/features/channels/typedefs/telegram.typedefs';
import { BadgeTone } from '@/shared/ui/display/Badge';

export const TELEGRAM_CONNECTION_TONE: Readonly<Record<TelegramChannelStatus, BadgeTone>> = {
  [TelegramChannelStatus.Pending]: BadgeTone.Warn,
  [TelegramChannelStatus.Connected]: BadgeTone.Ok,
  [TelegramChannelStatus.Broken]: BadgeTone.Err,
  [TelegramChannelStatus.Disconnected]: BadgeTone.Neutral,
};

export const TELEGRAM_CONNECTION_STATUS_KEY: Readonly<
  Record<
    TelegramChannelStatus,
    | 'telegram.bot.connection.pending'
    | 'telegram.bot.connection.connected'
    | 'telegram.bot.connection.revoked'
    | 'telegram.bot.connection.disconnected'
  >
> = {
  [TelegramChannelStatus.Pending]: 'telegram.bot.connection.pending',
  [TelegramChannelStatus.Connected]: 'telegram.bot.connection.connected',
  [TelegramChannelStatus.Broken]: 'telegram.bot.connection.revoked',
  [TelegramChannelStatus.Disconnected]: 'telegram.bot.connection.disconnected',
};
