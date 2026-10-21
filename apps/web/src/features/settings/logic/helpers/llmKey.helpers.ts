import {
  DEFAULT_LLM_VENDOR,
  LLM_KEY_MASK_CHARACTER,
  LLM_KEY_VISIBLE_LENGTH,
  LLM_KEY_VISIBLE_PREFIX,
  LLM_VENDOR_ORDER,
} from '@/features/settings/constants/llmKey.constants';
import type { LlmKey, LlmProviderModels } from '@/features/settings/typedefs/llmKey.typedefs';
import type { ModelVendor } from '@/shared/api/generated/schema.generated';

export const llmKeyLast4 = (rawKey: string): string => rawKey.slice(-LLM_KEY_VISIBLE_LENGTH);

export const maskLlmKeyInput = (rawKey: string): string =>
  rawKey.length <= LLM_KEY_VISIBLE_PREFIX
    ? rawKey
    : `${rawKey.slice(0, LLM_KEY_VISIBLE_PREFIX)}${LLM_KEY_MASK_CHARACTER.repeat(
        rawKey.length - LLM_KEY_VISIBLE_PREFIX,
      )}`;

export const applyLlmKeyEdit = (current: string, next: string): string => {
  if (!next.includes(LLM_KEY_MASK_CHARACTER)) {
    return next;
  }
  const visible = maskLlmKeyInput(current);
  const added = next.length - visible.length;
  if (added > 0) {
    return current + next.slice(visible.length);
  }
  if (added < 0) {
    return current.slice(0, current.length + added);
  }
  return current;
};

export const llmVendorFromValue = (value: string): ModelVendor | null =>
  LLM_VENDOR_ORDER.find((vendor) => vendor === value) ?? null;

export const firstVendorWithoutKey = (
  providers: readonly LlmProviderModels[],
  keys: readonly LlmKey[],
): ModelVendor => {
  const keyed = new Set(keys.map((key) => key.vendor));
  return (
    providers.find((provider) => !keyed.has(provider.vendor))?.vendor ??
    providers[0]?.vendor ??
    DEFAULT_LLM_VENDOR
  );
};
