import type { TelegramChannelView } from '@/features/channels/typedefs/telegram.typedefs';
import type { SelectOption } from '@/shared/ui/inputs/Select';

export interface TelegramBotWhoAnswersProps {
  readonly channel: TelegramChannelView;
  readonly agentOptions: readonly SelectOption[];
  readonly agentId: string;
  readonly typing: boolean;
  readonly onAgentChange: (value: string) => void;
  readonly onTypingChange: (checked: boolean) => void;
}
