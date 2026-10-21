import type { ReasoningLevel } from '@agent-ic/contracts';
import type { PromptSource } from '@agent-ic/flow';
import type {
  LlmStepExtra,
  LlmStepView,
  OutputFieldPatch,
} from '@/features/flow-builder/typedefs/llmStep.typedefs';

export interface LlmStepInspectorProps {
  workspaceId: string;
  step: LlmStepView;
  extra: LlmStepExtra;
  onPromptChange: (source: PromptSource) => void;
  onPromptCommit: () => void;
  onRetryModels: () => void;
  onModelChange: (modelId: string) => void;
  onReasoningChange: (reasoning: ReasoningLevel | null) => void;
  onAddField: () => void;
  onFieldChange: (index: number, patch: OutputFieldPatch) => void;
  onRemoveField: (index: number) => void;
}
