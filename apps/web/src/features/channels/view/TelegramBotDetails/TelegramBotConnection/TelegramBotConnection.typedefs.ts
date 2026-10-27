import type { TelegramChannelView } from '@/features/channels/typedefs/telegram.typedefs';

export interface TelegramBotConnectionProps {
  readonly channel: TelegramChannelView;
  readonly onReplaceToken: () => void;
}
