import type { ApiReplyMode } from '@/features/channels/typedefs/apiChannel.typedefs';
import type { SelectOption } from '@/shared/ui/inputs/Select';

export interface CreateApiChannelDialogProps {
  readonly name: string;
  readonly agentId: string;
  readonly agentOptions: readonly SelectOption[];
  readonly replyMode: ApiReplyMode;
  readonly webhook: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly onNameChange: (value: string) => void;
  readonly onAgentChange: (value: string) => void;
  readonly onReplyModeChange: (value: ApiReplyMode) => void;
  readonly onWebhookChange: (value: string) => void;
  readonly onCancel: () => void;
  readonly onCreate: () => void;
}
