import { LLM_KEY_MIN_LENGTH, LLM_KEY_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import {
  LLM_KEY_CHECK_CHECKING,
  LLM_KEY_CHECK_IDLE,
  LLM_KEY_HTTPS_PROTOCOL,
  LLM_KEY_MASK_CHARACTER,
  LLM_KEY_VISIBLE_PREFIX,
  LLM_KNOWN_VENDOR_ORDER,
  LLM_SELECTABLE_VENDORS,
} from '@/features/settings/constants/llmKey.constants';
import type {
  LlmKey,
  LlmKeyCheckInput,
  LlmKeyCheckOutcome,
  LlmKeyCheckState,
  LlmKeyDraft,
} from '@/features/settings/typedefs/llmKey.typedefs';
import { LlmKeyVendor } from '@/shared/api/generated/schema.generated';

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

export const llmVendorFromValue = (value: string): LlmKeyVendor | null =>
  LLM_SELECTABLE_VENDORS.find((vendor) => vendor === value) ?? null;

export const firstVendorWithoutKey = (keys: readonly LlmKey[]): LlmKeyVendor => {
  const keyed = new Set(keys.map((key) => key.vendor));
  return LLM_KNOWN_VENDOR_ORDER.find((vendor) => !keyed.has(vendor)) ?? LlmKeyVendor.Custom;
};

export const parseHttpsUrl = (value: string): URL | null => {
  try {
    const url = new URL(value.trim());
    return url.protocol === LLM_KEY_HTTPS_PROTOCOL ? url : null;
  } catch {
    return null;
  }
};

export const llmKeyHost = (baseUrl: string | null): string => {
  if (baseUrl === null) {
    return '';
  }
  return parseHttpsUrl(baseUrl)?.host ?? baseUrl;
};

export const llmKeyCheckInput = (
  draft: Pick<LlmKeyDraft, 'vendor' | 'apiKey' | 'baseUrl'>,
): LlmKeyCheckInput | null => {
  const apiKey = draft.apiKey.trim();
  if (apiKey.length < LLM_KEY_MIN_LENGTH) {
    return null;
  }
  if (draft.vendor !== LlmKeyVendor.Custom) {
    return { vendor: draft.vendor, apiKey, baseUrl: null };
  }
  if (parseHttpsUrl(draft.baseUrl) === null) {
    return null;
  }
  return { vendor: draft.vendor, apiKey, baseUrl: draft.baseUrl.trim() };
};

export const isCustomNameValid = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= LLM_KEY_NAME_MAX_LENGTH;
};

export const isLlmKeyDraftComplete = (draft: LlmKeyDraft): boolean =>
  draft.vendor !== LlmKeyVendor.Custom || isCustomNameValid(draft.name);

export const resolveLlmKeyCheck = (
  checkId: string | null,
  outcome: LlmKeyCheckOutcome | null,
): LlmKeyCheckState => {
  if (checkId === null) {
    return LLM_KEY_CHECK_IDLE;
  }
  return outcome?.checkId === checkId ? outcome.state : LLM_KEY_CHECK_CHECKING;
};
