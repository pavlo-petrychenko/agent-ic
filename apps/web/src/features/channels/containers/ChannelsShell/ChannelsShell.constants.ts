import { TelegramChannelStatus } from '@/features/channels/typedefs/telegram.typedefs';

export const TELEGRAM_NAV_STATUS_KEY: Readonly<
  Record<TelegramChannelStatus, 'nav.connecting' | 'nav.tokenRevoked' | 'nav.disconnected' | null>
> = {
  [TelegramChannelStatus.Pending]: 'nav.connecting',
  [TelegramChannelStatus.Connected]: null,
  [TelegramChannelStatus.Broken]: 'nav.tokenRevoked',
  [TelegramChannelStatus.Disconnected]: 'nav.disconnected',
};
