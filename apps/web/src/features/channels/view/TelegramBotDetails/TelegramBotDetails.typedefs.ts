import type { TelegramChannelView } from '@/features/channels/typedefs/telegram.typedefs';
import type { SelectOption } from '@/shared/ui/inputs/Select';

export interface TelegramBotDetailsProps {
  readonly channelsLink: string;
  readonly channel: TelegramChannelView;
  readonly agentOptions: readonly SelectOption[];
  readonly agentId: string;
  readonly typing: boolean;
  readonly onAgentChange: (value: string) => void;
  readonly onTypingChange: (checked: boolean) => void;
  readonly onReplaceToken: () => void;
  readonly onDisconnect: () => void;
  readonly onSave: () => void;
}
