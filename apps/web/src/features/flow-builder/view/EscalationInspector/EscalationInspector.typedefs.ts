import type { EscalationMode, EscalationNode, FlowIssue, NotifyChannel } from '@agent-ic/flow';
import type {
  EscalatePatch,
  RoleCounts,
} from '@/features/flow-builder/typedefs/escalation.typedefs';
import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';

export interface EscalationInspectorProps {
  config: EscalationNode['config'];
  variables: readonly VariableOption[];
  recipients: string;
  counts: RoleCounts | null;
  issue: (path: string) => FlowIssue | null;
  onModeChange: (mode: EscalationMode) => void;
  onMessageChange: (text: string) => void;
  onTemplateChange: (patch: EscalatePatch) => void;
  onCommit: () => void;
  onRecipientsChange: (value: string) => void;
  onChannelChange: (channel: NotifyChannel, on: boolean) => void;
}
