import { ReasoningLevel } from '@agent-ic/contracts';
import { ModelProviderKind } from '@agent-ic/flow';
import type { ModelOption } from '@/modules/agents/typedefs/model-option.typedefs';
import type { ModelOption as GraphqlModelOption } from '@/platform/graphql-server/generated/schema.generated';
import {
  ModelPurpose as GraphqlModelPurpose,
  ModelSource as GraphqlModelSource,
  ModelVendor as GraphqlModelVendor,
  ReasoningLevel as GraphqlReasoningLevel,
} from '@/platform/graphql-server/generated/schema.generated';
import { LlmPurpose, LlmVendor } from '@/platform/llm/constants/llm-model.constants';

const GRAPHQL_MODEL_VENDOR: Readonly<Record<ModelOption['vendor'], GraphqlModelVendor>> = {
  [LlmVendor.OpenAi]: GraphqlModelVendor.Openai,
  [LlmVendor.Anthropic]: GraphqlModelVendor.Anthropic,
  [LlmVendor.Mistral]: GraphqlModelVendor.Mistral,
  [LlmVendor.Xiaomi]: GraphqlModelVendor.Xiaomi,
  [LlmVendor.Google]: GraphqlModelVendor.Google,
  [LlmVendor.Zhipu]: GraphqlModelVendor.Zhipu,
  [LlmVendor.DeepSeek]: GraphqlModelVendor.Deepseek,
};

const GRAPHQL_MODEL_SOURCE: Readonly<Record<ModelProviderKind, GraphqlModelSource>> = {
  [ModelProviderKind.Platform]: GraphqlModelSource.Platform,
  [ModelProviderKind.Workspace]: GraphqlModelSource.Workspace,
};

const GRAPHQL_MODEL_PURPOSE: Readonly<Record<LlmPurpose, GraphqlModelPurpose>> = {
  [LlmPurpose.Conversation]: GraphqlModelPurpose.Conversation,
  [LlmPurpose.Light]: GraphqlModelPurpose.Light,
};

const GRAPHQL_REASONING_LEVEL: Readonly<Record<ReasoningLevel, GraphqlReasoningLevel>> = {
  [ReasoningLevel.None]: GraphqlReasoningLevel.None,
  [ReasoningLevel.Low]: GraphqlReasoningLevel.Low,
  [ReasoningLevel.Medium]: GraphqlReasoningLevel.Medium,
  [ReasoningLevel.High]: GraphqlReasoningLevel.High,
  [ReasoningLevel.XHigh]: GraphqlReasoningLevel.Xhigh,
  [ReasoningLevel.Max]: GraphqlReasoningLevel.Max,
};

export const toGraphqlModelOption = (option: ModelOption): GraphqlModelOption => ({
  id: option.id,
  label: option.label,
  vendor: GRAPHQL_MODEL_VENDOR[option.vendor],
  source: GRAPHQL_MODEL_SOURCE[option.source],
  purposes: option.purposes.map((purpose) => GRAPHQL_MODEL_PURPOSE[purpose]),
  defaultFor: option.defaultFor.map((purpose) => GRAPHQL_MODEL_PURPOSE[purpose]),
  price: option.price,
  reasoningLevels: option.reasoningLevels.map((level) => GRAPHQL_REASONING_LEVEL[level]),
  defaultReasoningLevel:
    option.defaultReasoningLevel === null
      ? null
      : GRAPHQL_REASONING_LEVEL[option.defaultReasoningLevel],
});
