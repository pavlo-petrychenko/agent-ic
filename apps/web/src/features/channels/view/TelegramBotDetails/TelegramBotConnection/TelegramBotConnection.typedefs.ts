import type { TelegramBotMock } from '@/features/channels/typedefs/telegramBot.typedefs';

export interface TelegramBotConnectionProps {
  readonly bot: TelegramBotMock;
  readonly revoked: boolean;
  readonly onReplaceToken: () => void;
}
