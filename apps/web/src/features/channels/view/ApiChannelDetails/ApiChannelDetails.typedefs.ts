import type {
  ApiChannelView,
  ApiReplyMode,
} from '@/features/channels/typedefs/apiChannel.typedefs';
import type { SelectOption } from '@/shared/ui/inputs/Select';

export interface ApiChannelDetailsProps {
  readonly channelsLink: string;
  readonly channel: ApiChannelView;
  readonly agentOptions: readonly SelectOption[];
  readonly agentId: string;
  readonly replyMode: ApiReplyMode;
  readonly webhook: string;
  readonly saving: boolean;
  readonly rotating: boolean;
  readonly deleting: boolean;
  readonly onAgentChange: (value: string) => void;
  readonly onReplyModeChange: (value: ApiReplyMode) => void;
  readonly onWebhookChange: (value: string) => void;
  readonly onSave: () => void;
  readonly onDelete: () => void;
  readonly onRotate: () => void;
}
