import type { LlmKeyVendor, ReasoningLevel } from '@agent-ic/contracts';
import type {
  EmbeddingModelId,
  LlmAgentFinish,
  LlmApi,
  LlmModelId,
  LlmPurpose,
  LlmStructuredOutput,
  LlmVendor,
} from '@/platform/llm/constants/llm-model.constants';

export type LlmChatVendor =
  | LlmVendor.OpenAi
  | LlmVendor.Anthropic
  | LlmVendor.Mistral
  | LlmVendor.Xiaomi
  | LlmVendor.Google
  | LlmVendor.Zhipu
  | LlmVendor.DeepSeek;

export interface LlmPrice {
  readonly inputUsdPerMillionTokens: number;
  readonly outputUsdPerMillionTokens: number;
}

export interface LlmModel {
  readonly id: LlmModelId;
  readonly label: string;
  readonly vendor: LlmChatVendor;
  readonly purposes: readonly LlmPurpose[];
  readonly price: LlmPrice;
  readonly fallback: LlmModelId;
  readonly api: LlmApi;
  readonly structuredOutput: LlmStructuredOutput;
  readonly agentFinish: LlmAgentFinish;
  readonly reasoningLevels: readonly ReasoningLevel[];
  readonly reasoningEffort: ReasoningLevel | null;
}

export interface LlmEmbeddingModel {
  readonly id: EmbeddingModelId;
  readonly vendor: LlmVendor;
  readonly price: LlmPrice;
  readonly dimensions: number;
  readonly batchSize: number;
}

export type LlmProfileVendor = LlmChatVendor | LlmKeyVendor.Custom;

export interface LlmModelProfile {
  readonly id: string;
  readonly label: string;
  readonly vendor: LlmProfileVendor;
  readonly api: LlmApi;
  readonly structuredOutput: LlmStructuredOutput;
  readonly agentFinish: LlmAgentFinish;
  readonly reasoningLevels: readonly ReasoningLevel[];
  readonly reasoningEffort: ReasoningLevel | null;
  readonly price: LlmPrice | null;
  readonly fallback: LlmModelId | null;
}

export type LlmVendorProfile = Omit<LlmModelProfile, 'id' | 'label'>;

export interface LlmPricedModel {
  readonly id: string;
  readonly price: LlmPrice | null;
}
