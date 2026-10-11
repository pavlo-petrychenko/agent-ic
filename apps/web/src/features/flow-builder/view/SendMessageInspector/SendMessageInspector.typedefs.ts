import type {
  FlowIssue,
  MessageContentKind,
  QuickRepliesKind,
  SendMessageNode,
} from '@agent-ic/flow';
import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';

export interface SendMessageInspectorProps {
  config: SendMessageNode['config'];
  variables: readonly VariableOption[];
  lists: readonly string[];
  contentIssue: FlowIssue | null;
  buttonsIssue: FlowIssue | null;
  onChange: (patch: Partial<SendMessageNode['config']>) => void;
  onTextChange: (text: string) => void;
  onCommit: () => void;
  onContentKindChange: (kind: MessageContentKind) => void;
  onButtonsKindChange: (kind: QuickRepliesKind) => void;
  onButtonChange: (index: number, label: string | null) => void;
}
