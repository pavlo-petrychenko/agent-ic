import type { FlowIssue, MessageContentKind, QuickRepliesKind } from '@agent-ic/flow';
import type { SendMessageConfig } from '@/features/flow-builder/typedefs/sendMessage.typedefs';
import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';

export interface SendMessageInspectorProps {
  config: SendMessageConfig;
  variables: readonly VariableOption[];
  lists: readonly string[];
  contentIssue: FlowIssue | null;
  buttonsIssue: FlowIssue | null;
  onChange: (patch: Partial<SendMessageConfig>) => void;
  onTextChange: (text: string) => void;
  onCommit: () => void;
  onContentKindChange: (kind: MessageContentKind) => void;
  onButtonsKindChange: (kind: QuickRepliesKind) => void;
  onButtonChange: (index: number, label: string | null) => void;
}
