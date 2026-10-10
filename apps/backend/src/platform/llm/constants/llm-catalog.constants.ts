import { LlmModelId, LlmPurpose, LlmVendor } from '@/platform/llm/constants/llm-model.constants';
import type { LlmModel } from '@/platform/llm/typedefs/llm-model.typedefs';

export const LLM_CATALOG: Readonly<Record<LlmModelId, LlmModel>> = {
  [LlmModelId.Gpt54Mini]: {
    id: LlmModelId.Gpt54Mini,
    vendor: LlmVendor.OpenAi,
    purpose: LlmPurpose.Conversation,
    price: { inputUsdPerMillionTokens: 0.75, outputUsdPerMillionTokens: 4.5 },
    fallback: LlmModelId.Gemini38Flash,
  },
  [LlmModelId.ClaudeSonnet55]: {
    id: LlmModelId.ClaudeSonnet55,
    vendor: LlmVendor.Anthropic,
    purpose: LlmPurpose.Conversation,
    price: { inputUsdPerMillionTokens: 2, outputUsdPerMillionTokens: 10 },
    fallback: LlmModelId.Gpt61Sol,
  },
  [LlmModelId.Gpt61Sol]: {
    id: LlmModelId.Gpt61Sol,
    vendor: LlmVendor.OpenAi,
    purpose: LlmPurpose.Conversation,
    price: { inputUsdPerMillionTokens: 2, outputUsdPerMillionTokens: 10 },
    fallback: LlmModelId.ClaudeSonnet55,
  },
  [LlmModelId.Gemini38Flash]: {
    id: LlmModelId.Gemini38Flash,
    vendor: LlmVendor.Google,
    purpose: LlmPurpose.Conversation,
    price: { inputUsdPerMillionTokens: 0.75, outputUsdPerMillionTokens: 3.75 },
    fallback: LlmModelId.Gpt54Mini,
  },
  [LlmModelId.DeepSeekV41Flash]: {
    id: LlmModelId.DeepSeekV41Flash,
    vendor: LlmVendor.DeepSeek,
    purpose: LlmPurpose.Conversation,
    price: { inputUsdPerMillionTokens: 0.3, outputUsdPerMillionTokens: 1.2 },
    fallback: LlmModelId.Gemini38Flash,
  },
  [LlmModelId.Gemini35FlashLite]: {
    id: LlmModelId.Gemini35FlashLite,
    vendor: LlmVendor.Google,
    purpose: LlmPurpose.Light,
    price: { inputUsdPerMillionTokens: 0.3, outputUsdPerMillionTokens: 2.5 },
    fallback: LlmModelId.Gpt56Luna,
  },
  [LlmModelId.Gpt56Luna]: {
    id: LlmModelId.Gpt56Luna,
    vendor: LlmVendor.OpenAi,
    purpose: LlmPurpose.Light,
    price: { inputUsdPerMillionTokens: 0.2, outputUsdPerMillionTokens: 1.2 },
    fallback: LlmModelId.Gemini35FlashLite,
  },
  [LlmModelId.Gpt54Nano]: {
    id: LlmModelId.Gpt54Nano,
    vendor: LlmVendor.OpenAi,
    purpose: LlmPurpose.Light,
    price: { inputUsdPerMillionTokens: 0.2, outputUsdPerMillionTokens: 1.25 },
    fallback: LlmModelId.Gemini35FlashLite,
  },
};

export const LLM_DEFAULT_MODEL: Readonly<Record<LlmPurpose, LlmModelId>> = {
  [LlmPurpose.Conversation]: LlmModelId.Gpt54Mini,
  [LlmPurpose.Light]: LlmModelId.Gemini35FlashLite,
};
