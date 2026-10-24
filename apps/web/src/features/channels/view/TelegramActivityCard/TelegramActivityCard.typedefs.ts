import type { TelegramBotStats } from '@/features/channels/typedefs/telegramBot.typedefs';

export interface TelegramActivityCardProps {
  readonly stats: TelegramBotStats;
}
