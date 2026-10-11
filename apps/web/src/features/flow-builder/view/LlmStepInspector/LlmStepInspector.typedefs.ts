import type { ReasoningLevel } from '@agent-ic/contracts';
import type {
  LlmStepView,
  OutputFieldPatch,
} from '@/features/flow-builder/typedefs/llmStep.typedefs';

export interface LlmStepInspectorProps {
  step: LlmStepView;
  onPromptChange: (text: string) => void;
  onModelChange: (modelId: string) => void;
  onReasoningChange: (reasoning: ReasoningLevel | null) => void;
  onAddField: () => void;
  onFieldChange: (index: number, patch: OutputFieldPatch) => void;
  onRemoveField: (index: number) => void;
}
