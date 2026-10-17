import type { LlmKey } from '@/features/settings/typedefs/llmKey.typedefs';
import { ModelVendor } from '@/shared/api/generated/schema.generated';

export const LLM_VENDOR_ORDER: readonly ModelVendor[] = [
  ModelVendor.Openai,
  ModelVendor.Anthropic,
  ModelVendor.Google,
  ModelVendor.Mistral,
  ModelVendor.Xiaomi,
  ModelVendor.Zhipu,
  ModelVendor.Deepseek,
];

export const DEFAULT_LLM_VENDOR = ModelVendor.Openai;
export const LLM_KEY_VISIBLE_LENGTH = 4;
export const LLM_NOTICE_ICON_SIZE = 14;

export const MOCK_LLM_KEYS: readonly LlmKey[] = [
  {
    vendor: ModelVendor.Anthropic,
    last4: '41aa',
    usedBySteps: 2,
  },
];
