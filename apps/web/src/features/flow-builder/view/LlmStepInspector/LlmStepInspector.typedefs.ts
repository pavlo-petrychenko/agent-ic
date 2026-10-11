import type { ReasoningLevel } from '@agent-ic/contracts';
import type { LlmStepView } from '@/features/flow-builder/typedefs/llmStep.typedefs';

export interface LlmStepInspectorProps {
  step: LlmStepView;
  onPromptChange: (text: string) => void;
  onModelChange: (modelId: string) => void;
  onReasoningChange: (reasoning: ReasoningLevel | null) => void;
}
