import type { FlowIssue, FlowSettings, HandoffSettings, NotifyChannel } from '@agent-ic/flow';
import type { FailureChoice } from '@/features/flow-builder/constants/flowSettings.constants';
import type { RoleCounts } from '@/features/flow-builder/typedefs/escalation.typedefs';
import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';

export interface FlowSettingsInspectorProps {
  settings: FlowSettings;
  handoff: HandoffSettings;
  variables: readonly VariableOption[];
  recipients: string;
  counts: RoleCounts | null;
  fallbackIssue: FlowIssue | null;
  onRecipientsChange: (value: string) => void;
  onChannelChange: (channel: NotifyChannel, on: boolean) => void;
  onFallbackMessageChange: (text: string) => void;
  onFailureChange: (choice: FailureChoice) => void;
  onApologyChange: (text: string) => void;
  onAutoCloseToggle: (on: boolean) => void;
  onAutoCloseChange: (minutes: number) => void;
  onCommit: () => void;
}
