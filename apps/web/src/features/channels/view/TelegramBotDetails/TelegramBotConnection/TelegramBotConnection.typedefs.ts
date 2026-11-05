import type { TelegramChannelView } from '@/features/channels/typedefs/telegram.typedefs';

export interface TelegramBotConnectionProps {
  readonly channel: TelegramChannelView;
  readonly lastUpdate: string;
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
  readonly onReplaceToken: () => void;
}
