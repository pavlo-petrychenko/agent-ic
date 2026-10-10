import type {
  LlmModelId,
  LlmPurpose,
  LlmVendor,
} from '@/platform/llm/constants/llm-model.constants';

export interface LlmPrice {
  readonly inputUsdPerMillionTokens: number;
  readonly outputUsdPerMillionTokens: number;
}

export interface LlmModel {
  readonly id: LlmModelId;
  readonly vendor: LlmVendor;
  readonly purpose: LlmPurpose;
  readonly price: LlmPrice;
  readonly fallback: LlmModelId;
}
