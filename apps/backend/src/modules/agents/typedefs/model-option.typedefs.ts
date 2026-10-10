import type { ReasoningLevel } from '@agent-ic/contracts';
import type { ModelProviderKind } from '@agent-ic/flow';
import type {
  LlmModelId,
  LlmPurpose,
  LlmVendor,
} from '@/platform/llm/constants/llm-model.constants';
import type { LlmPrice } from '@/platform/llm/typedefs/llm-model.typedefs';

export interface ModelOption {
  readonly id: LlmModelId;
  readonly label: string;
  readonly vendor: LlmVendor;
  readonly source: ModelProviderKind;
  readonly purposes: readonly LlmPurpose[];
  readonly defaultFor: readonly LlmPurpose[];
  readonly price: LlmPrice;
  readonly reasoningLevels: readonly ReasoningLevel[];
  readonly defaultReasoningLevel: ReasoningLevel | null;
}
