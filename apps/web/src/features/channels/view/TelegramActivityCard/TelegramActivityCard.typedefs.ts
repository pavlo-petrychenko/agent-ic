import type { TelegramBotStats } from '@/features/channels/typedefs/telegram.typedefs';

export interface TelegramActivityCardProps {
  readonly stats: TelegramBotStats;
}
