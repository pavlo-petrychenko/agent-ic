import { LLM_KEY_MIN_LENGTH, LLM_KEY_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import {
  LLM_KEY_CHECK_CHECKING,
  LLM_KEY_CHECK_IDLE,
  LLM_KEY_MASK_CHARACTER,
  LlmKeyCheckStatus,
  LLM_KEY_VISIBLE_PREFIX,
} from '@/features/settings/constants/llmKey.constants';
import {
  applyLlmKeyEdit,
  firstVendorWithoutKey,
  isLlmKeyDraftComplete,
  llmKeyCheckInput,
  llmKeyHost,
  llmVendorFromValue,
  maskLlmKeyInput,
  resolveLlmKeyCheck,
} from '@/features/settings/logic/helpers/llmKey.helpers';
import type { LlmKey } from '@/features/settings/typedefs/llmKey.typedefs';
import { LlmKeyVendor } from '@/shared/api/generated/schema.generated';

const keyFor = (vendor: LlmKeyVendor): LlmKey => ({
  id: `llk_${vendor}`,
  vendor,
  name: vendor,
  baseUrl: null,
  keyLast4: '41aa',
  fallbackToPlatform: false,
  addedBy: 'Pavlo',
  createdAt: '2026-10-20T10:00:00.000Z',
  usedBySteps: 0,
});

const maskedKey = (rawKey: string): string =>
  `${rawKey.slice(0, LLM_KEY_VISIBLE_PREFIX)}${LLM_KEY_MASK_CHARACTER.repeat(
    rawKey.length - LLM_KEY_VISIBLE_PREFIX,
  )}`;

const VALID_KEY = 'k'.repeat(LLM_KEY_MIN_LENGTH);

describe('llm key helpers', () => {
  it('keeps the visible prefix and masks the rest', () => {
    expect(maskLlmKeyInput('')).toBe('');
    expect(maskLlmKeyInput('sk-')).toBe('sk-');
    expect(maskLlmKeyInput('sk-9999')).toBe('sk-••••');

    const longKey = 'sk-openai-test-9999';
    expect(maskLlmKeyInput(longKey)).toBe(maskedKey(longKey));
    expect(maskLlmKeyInput(longKey)).toHaveLength(longKey.length);
  });

  it('rebuilds the raw key from an edit of the masked value', () => {
    expect(applyLlmKeyEdit('sk-', 'sk-o')).toBe('sk-o');
    expect(applyLlmKeyEdit('sk-9999', 'sk-••••a')).toBe('sk-9999a');
    expect(applyLlmKeyEdit('sk-9999', 'sk-•••')).toBe('sk-999');
    expect(applyLlmKeyEdit('sk-9999', 'sk-new-9999')).toBe('sk-new-9999');
  });

  it('resolves a vendor value including custom and rejects an unknown one', () => {
    expect(llmVendorFromValue('deepseek')).toBe(LlmKeyVendor.Deepseek);
    expect(llmVendorFromValue('custom')).toBe(LlmKeyVendor.Custom);
    expect(llmVendorFromValue('zhipu')).toBeNull();
  });

  it('offers the first known vendor without a key', () => {
    expect(firstVendorWithoutKey([keyFor(LlmKeyVendor.Openai)])).toBe(LlmKeyVendor.Anthropic);
    expect(firstVendorWithoutKey([])).toBe(LlmKeyVendor.Openai);
  });

  it('offers a custom endpoint once every known vendor has a key', () => {
    const keys = [
      LlmKeyVendor.Openai,
      LlmKeyVendor.Anthropic,
      LlmKeyVendor.Google,
      LlmKeyVendor.Mistral,
      LlmKeyVendor.Deepseek,
    ].map(keyFor);

    expect(firstVendorWithoutKey(keys)).toBe(LlmKeyVendor.Custom);
  });

  it('shows the host of a base url', () => {
    expect(llmKeyHost('https://llm.example.com/v1')).toBe('llm.example.com');
    expect(llmKeyHost('not a url')).toBe('not a url');
    expect(llmKeyHost(null)).toBe('');
  });

  it('builds a check input only for a long enough key', () => {
    expect(
      llmKeyCheckInput({ vendor: LlmKeyVendor.Openai, apiKey: ' short ', baseUrl: '' }),
    ).toBeNull();
    expect(
      llmKeyCheckInput({ vendor: LlmKeyVendor.Openai, apiKey: ` ${VALID_KEY} `, baseUrl: 'x' }),
    ).toEqual({ vendor: LlmKeyVendor.Openai, apiKey: VALID_KEY, baseUrl: null });
  });

  it('builds a custom check input only for an https base url', () => {
    const draft = { vendor: LlmKeyVendor.Custom, apiKey: VALID_KEY };

    expect(llmKeyCheckInput({ ...draft, baseUrl: '' })).toBeNull();
    expect(llmKeyCheckInput({ ...draft, baseUrl: 'http://llm.example.com/v1' })).toBeNull();
    expect(llmKeyCheckInput({ ...draft, baseUrl: 'https://llm.example.com/v1' })).toEqual({
      ...draft,
      baseUrl: 'https://llm.example.com/v1',
    });
  });

  it('requires a name of limited length for a custom endpoint only', () => {
    const base = { apiKey: VALID_KEY, baseUrl: '', fallbackToPlatform: false };

    expect(isLlmKeyDraftComplete({ ...base, vendor: LlmKeyVendor.Openai, name: '' })).toBe(true);
    expect(isLlmKeyDraftComplete({ ...base, vendor: LlmKeyVendor.Custom, name: ' ' })).toBe(false);
    expect(isLlmKeyDraftComplete({ ...base, vendor: LlmKeyVendor.Custom, name: 'Gateway' })).toBe(
      true,
    );
    expect(
      isLlmKeyDraftComplete({
        ...base,
        vendor: LlmKeyVendor.Custom,
        name: 'n'.repeat(LLM_KEY_NAME_MAX_LENGTH + 1),
      }),
    ).toBe(false);
  });

  it('resolves the check state of the current input only', () => {
    const outcome = {
      checkId: 'current',
      state: { status: LlmKeyCheckStatus.Ok, models: ['model-a'] } as const,
    };

    expect(resolveLlmKeyCheck(null, outcome)).toBe(LLM_KEY_CHECK_IDLE);
    expect(resolveLlmKeyCheck('current', outcome)).toBe(outcome.state);
    expect(resolveLlmKeyCheck('edited', outcome)).toBe(LLM_KEY_CHECK_CHECKING);
    expect(resolveLlmKeyCheck('current', null)).toBe(LLM_KEY_CHECK_CHECKING);
  });
});
