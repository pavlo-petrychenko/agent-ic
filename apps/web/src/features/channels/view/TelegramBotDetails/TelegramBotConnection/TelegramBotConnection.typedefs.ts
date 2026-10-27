import type { TelegramChannelView } from '@/features/channels/typedefs/telegram.typedefs';

export interface TelegramBotConnectionProps {
  readonly channel: TelegramChannelView;
  readonly lastUpdate: string;
  readonly onReplaceToken: () => void;
}
