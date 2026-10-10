import { ModelProviderKind } from '@agent-ic/flow';
import type { ModelOption } from '@/modules/agents/typedefs/model-option.typedefs';
import type { LlmModelId, LlmPurpose } from '@/platform/llm/constants/llm-model.constants';
import type { LlmModel } from '@/platform/llm/typedefs/llm-model.typedefs';

export const toModelOptions = (
  catalog: Readonly<Record<LlmModelId, LlmModel>>,
  defaults: Readonly<Record<LlmPurpose, LlmModelId>>,
): ModelOption[] =>
  Object.values(catalog).map((model) => ({
    id: model.id,
    label: model.label,
    vendor: model.vendor,
    source: ModelProviderKind.Platform,
    purposes: model.purposes,
    defaultFor: model.purposes.filter((purpose) => defaults[purpose] === model.id),
    price: model.price,
    reasoningLevels: model.reasoningLevels,
    defaultReasoningLevel: model.reasoningEffort,
  }));
