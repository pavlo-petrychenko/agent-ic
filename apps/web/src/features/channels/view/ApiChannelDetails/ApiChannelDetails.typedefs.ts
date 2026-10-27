import type {
  ApiChannelMock,
  ApiReplyMode,
} from '@/features/channels/typedefs/apiChannel.typedefs';
import type { SelectOption } from '@/shared/ui/inputs/Select';

export interface ApiChannelDetailsProps {
  readonly channelsLink: string;
  readonly channel: ApiChannelMock;
  readonly agentOptions: readonly SelectOption[];
  readonly agentId: string;
  readonly replyMode: ApiReplyMode;
  readonly webhook: string;
  readonly onAgentChange: (value: string) => void;
  readonly onReplyModeChange: (value: ApiReplyMode) => void;
  readonly onWebhookChange: (value: string) => void;
  readonly onSave: () => void;
  readonly onDelete: () => void;
  readonly onRotate: () => void;
}
