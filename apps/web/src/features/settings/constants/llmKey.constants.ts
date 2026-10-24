import type { LlmKeyCheckState } from '@/features/settings/typedefs/llmKey.typedefs';
import { LlmKeyVendor } from '@/shared/api/generated/schema.generated';

export const LLM_KNOWN_VENDOR_ORDER: readonly LlmKeyVendor[] = [
  LlmKeyVendor.Openai,
  LlmKeyVendor.Anthropic,
  LlmKeyVendor.Google,
  LlmKeyVendor.Mistral,
  LlmKeyVendor.Deepseek,
];

export const LLM_SELECTABLE_VENDORS: readonly LlmKeyVendor[] = [
  ...LLM_KNOWN_VENDOR_ORDER,
  LlmKeyVendor.Custom,
];

export const DEFAULT_LLM_VENDOR = LlmKeyVendor.Openai;
export const LLM_KEY_CHECK_DEBOUNCE_MS = 600;
export const LLM_KEY_HTTPS_PROTOCOL = 'https:';
export const LLM_KEY_VISIBLE_PREFIX = 3;
export const LLM_KEY_MASK_CHARACTER = '•';
export const LLM_NOTICE_ICON_SIZE = 14;
export const LLM_PLATFORM_ROW_ID = 'platform';
export const LLM_CUSTOM_ADD_ROW_ID = 'custom-add';
export const LLM_KEYS_SKELETON_ROWS = 3;

export enum LlmKeyCheckStatus {
  Idle = 'idle',
  Checking = 'checking',
  Ok = 'ok',
  Failed = 'failed',
}

export const LLM_KEY_CHECK_IDLE: LlmKeyCheckState = { status: LlmKeyCheckStatus.Idle };
export const LLM_KEY_CHECK_CHECKING: LlmKeyCheckState = { status: LlmKeyCheckStatus.Checking };
