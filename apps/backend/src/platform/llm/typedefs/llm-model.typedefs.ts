import type {
  EmbeddingModelId,
  LlmAgentFinish,
  LlmApi,
  LlmModelId,
  LlmPurpose,
  LlmReasoningEffort,
  LlmStructuredOutput,
  LlmVendor,
} from '@/platform/llm/constants/llm-model.constants';

export interface LlmPrice {
  readonly inputUsdPerMillionTokens: number;
  readonly outputUsdPerMillionTokens: number;
}

export interface LlmModel {
  readonly id: LlmModelId;
  readonly vendor: LlmVendor;
  readonly purposes: readonly LlmPurpose[];
  readonly price: LlmPrice;
  readonly fallback: LlmModelId;
  readonly api: LlmApi;
  readonly structuredOutput: LlmStructuredOutput;
  readonly agentFinish: LlmAgentFinish;
  readonly reasoningLevels: readonly LlmReasoningEffort[];
  readonly reasoningEffort: LlmReasoningEffort | null;
}

export interface LlmEmbeddingModel {
  readonly id: EmbeddingModelId;
  readonly vendor: LlmVendor;
  readonly price: LlmPrice;
  readonly dimensions: number;
  readonly batchSize: number;
}

export type LlmAnyModelId = LlmModelId | EmbeddingModelId;

export interface LlmPricedModel {
  readonly id: LlmAnyModelId;
  readonly price: LlmPrice;
}
