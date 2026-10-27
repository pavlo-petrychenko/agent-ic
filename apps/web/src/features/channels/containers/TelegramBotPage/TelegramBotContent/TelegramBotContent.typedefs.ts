import type { TelegramChannelView } from '@/features/channels/typedefs/telegram.typedefs';
import type { SelectOption } from '@/shared/ui/inputs/Select';

export interface TelegramBotContentProps {
  readonly workspaceId: string;
  readonly channel: TelegramChannelView;
  readonly agentOptions: readonly SelectOption[];
}
