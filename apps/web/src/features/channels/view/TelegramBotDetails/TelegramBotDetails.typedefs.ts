import type { TelegramBotMock } from '@/features/channels/typedefs/telegramBot.typedefs';
import type { SelectOption } from '@/shared/ui/inputs/Select';

export interface TelegramBotDetailsProps {
  readonly channelsLink: string;
  readonly bot: TelegramBotMock;
  readonly agentOptions: readonly SelectOption[];
  readonly agentId: string;
  readonly typing: boolean;
  readonly onAgentChange: (value: string) => void;
  readonly onTypingChange: (checked: boolean) => void;
  readonly onReplaceToken: () => void;
  readonly onDisconnect: () => void;
  readonly onSave: () => void;
}
