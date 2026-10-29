import type { ReasoningLevel } from '@agent-ic/contracts';
import type { PromptSource } from '@agent-ic/flow';
import type {
  LlmStepExtra,
  LlmStepView,
  OutputFieldPatch,
} from '@/features/flow-builder/typedefs/llmStep.typedefs';

export interface LlmStepInspectorProps {
  workspaceId: string;
  stepName: string;
  step: LlmStepView;
  extra: LlmStepExtra;
  onPromptChange: (source: PromptSource) => void;
  onPromptCommit: () => void;
  onModelChange: (key: string) => void;
  onModelType: (model: string, group: string | null) => void;
  onReasoningChange: (reasoning: ReasoningLevel | null) => void;
  onAddField: () => void;
  onFieldChange: (index: number, patch: OutputFieldPatch) => void;
  onRemoveField: (index: number) => void;
}
