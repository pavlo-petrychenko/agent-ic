import {
  LLM_KEY_LAST_CHARS,
  LLM_KEY_NAMES_LOCK_PREFIX,
  LLM_KEY_NAMES_LOCK_SEPARATOR,
} from '@/modules/llm-keys/constants/llm-key.constants';
import type { LlmKey } from '@/modules/llm-keys/typedefs/llm-key.typedefs';
import type { LlmWorkspaceKey } from '@/platform/llm/typedefs/llm-provider.typedefs';

export const llmKeyNamesLockKey = (workspaceId: string): string =>
  [LLM_KEY_NAMES_LOCK_PREFIX, workspaceId].join(LLM_KEY_NAMES_LOCK_SEPARATOR);

export const keyLast4 = (apiKey: string): string => apiKey.slice(-LLM_KEY_LAST_CHARS);

export const toWorkspaceKey = (key: LlmKey, apiKey: string): LlmWorkspaceKey => ({
  id: key.id,
  vendor: key.vendor,
  baseUrl: key.baseUrl,
  apiKey,
  fallbackToPlatform: key.fallbackToPlatform,
});
