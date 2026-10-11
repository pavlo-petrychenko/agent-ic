import type { ModelOptionsQuery } from '@/features/flow-builder/communication/gql/query/modelOptions.generated';
import { REASONING_FROM_API } from '@/features/flow-builder/constants/llmStep.constants';
import type { ModelChoice } from '@/features/flow-builder/typedefs/llmStep.typedefs';

export const toModelChoices = (data: ModelOptionsQuery): ModelChoice[] =>
  data.modelOptions.map((option) => ({
    id: option.id,
    label: option.label,
    vendor: option.vendor,
    purposes: option.purposes,
    reasoningLevels: option.reasoningLevels.map((level) => REASONING_FROM_API[level]),
    defaultReasoningLevel:
      option.defaultReasoningLevel === null
        ? null
        : REASONING_FROM_API[option.defaultReasoningLevel],
    inputPrice: option.price.inputUsdPerMillionTokens,
    outputPrice: option.price.outputUsdPerMillionTokens,
  }));
