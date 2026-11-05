import type { NotifyChannel } from '@agent-ic/flow';
import type { RoleCounts } from '@/features/flow-builder/typedefs/escalation.typedefs';

export interface HandoffNotifyFieldsProps {
  channels: readonly NotifyChannel[];
  recipients: string;
  counts: RoleCounts | null;
  onRecipientsChange: (value: string) => void;
  onChannelChange: (channel: NotifyChannel, on: boolean) => void;
}
