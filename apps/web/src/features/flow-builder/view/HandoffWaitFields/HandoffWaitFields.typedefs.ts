import type { FlowIssue, HandoffSettings } from '@agent-ic/flow';
import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';

export interface HandoffWaitFieldsProps {
  label: string;
  handoff: HandoffSettings;
  variables: readonly VariableOption[];
  fallbackIssue: FlowIssue | null;
  onFallbackMessageChange: (text: string) => void;
  onCommit: () => void;
}
