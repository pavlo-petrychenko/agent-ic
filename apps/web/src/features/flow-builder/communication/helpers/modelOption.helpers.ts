import type { ModelOptionsQuery } from '@/features/flow-builder/communication/gql/query/modelOptions.generated';
import { REASONING_FROM_API } from '@/features/flow-builder/constants/llmStep.constants';
import type { LlmKeyChoice, ModelChoice } from '@/features/flow-builder/typedefs/llmStep.typedefs';
import { ModelSource } from '@/shared/api/generated/schema.generated';
import type { ModelPurpose } from '@/shared/api/generated/schema.generated';

export const toModelChoices = (data: ModelOptionsQuery): ModelChoice[] =>
  data.modelOptions.map((option) => ({
    id: option.id,
    label: option.label,
    vendor: option.vendor,
    source: option.source,
    providerKeyId: null,
    purposes: option.purposes,
    reasoningLevels: option.reasoningLevels.map((level) => REASONING_FROM_API[level]),
    defaultReasoningLevel:
      option.defaultReasoningLevel === null
        ? null
        : REASONING_FROM_API[option.defaultReasoningLevel],
    inputPrice: option.price.inputUsdPerMillionTokens,
    outputPrice: option.price.outputUsdPerMillionTokens,
  }));

export const toKeyModelChoices = (
  key: LlmKeyChoice,
  ids: readonly string[],
  purposes: readonly ModelPurpose[],
): ModelChoice[] =>
  ids.map((id) => ({
    id,
    label: id,
    vendor: null,
    source: ModelSource.Workspace,
    providerKeyId: key.id,
    purposes,
    reasoningLevels: [],
    defaultReasoningLevel: null,
    inputPrice: null,
    outputPrice: null,
  }));
