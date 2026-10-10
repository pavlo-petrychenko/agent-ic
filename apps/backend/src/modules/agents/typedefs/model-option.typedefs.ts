import type { ReasoningLevel } from '@agent-ic/contracts';
import type { ModelProviderKind } from '@agent-ic/flow';
import type { LlmPurpose } from '@/platform/llm/constants/llm-model.constants';
import type { LlmModel } from '@/platform/llm/typedefs/llm-model.typedefs';

export interface ModelOption extends Pick<
  LlmModel,
  'id' | 'label' | 'vendor' | 'purposes' | 'price' | 'reasoningLevels'
> {
  readonly source: ModelProviderKind;
  readonly defaultFor: readonly LlmPurpose[];
  readonly defaultReasoningLevel: ReasoningLevel | null;
}
