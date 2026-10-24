import { LlmKeyVendor } from '@agent-ic/contracts';

export const LLM_KEYS_SCHEMA = 'llm_keys';
export const LLM_KEY_LAST_CHARS = 4;
export const LLM_KEY_NAMES_LOCK_PREFIX = 'llm-keys.names';
export const LLM_KEY_NAMES_LOCK_SEPARATOR = ':';

export const LLM_KEY_VENDOR_NAMES: Readonly<
  Record<Exclude<LlmKeyVendor, LlmKeyVendor.Custom>, string>
> = {
  [LlmKeyVendor.OpenAi]: 'OpenAI',
  [LlmKeyVendor.Anthropic]: 'Anthropic',
  [LlmKeyVendor.Google]: 'Google',
  [LlmKeyVendor.Mistral]: 'Mistral',
  [LlmKeyVendor.DeepSeek]: 'DeepSeek',
};

export const LLM_KEY_PROBE_ID = 'probe';
export const LLM_KEY_AUTHOR_UNKNOWN = '';
export const NEW_LLM_KEY_STEP_COUNT = 0;
