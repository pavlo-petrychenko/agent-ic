import { describe, expect, it } from 'vitest';
import {
  LLM_KEY_MASK_CHARACTER,
  LLM_KEY_VISIBLE_PREFIX,
} from '@/features/settings/constants/llmKey.constants';
import {
  applyLlmKeyEdit,
  firstVendorWithoutKey,
  llmKeyLast4,
  llmVendorFromValue,
  maskLlmKeyInput,
} from '@/features/settings/logic/helpers/llmKey.helpers';
import { ModelVendor } from '@/shared/api/generated/schema.generated';

const KEYED: readonly { vendor: ModelVendor; last4: string; usedBySteps: number }[] = [
  { vendor: ModelVendor.Anthropic, last4: '41aa', usedBySteps: 2 },
];

const maskedKey = (rawKey: string): string =>
  `${rawKey.slice(0, LLM_KEY_VISIBLE_PREFIX)}${LLM_KEY_MASK_CHARACTER.repeat(
    rawKey.length - LLM_KEY_VISIBLE_PREFIX,
  )}`;

describe('llm key helpers', () => {
  it('keeps the last four characters of a key', () => {
    expect(llmKeyLast4('sk-openai-test-9999')).toBe('9999');
    expect(llmKeyLast4('ab')).toBe('ab');
  });

  it('keeps the visible prefix and masks the rest', () => {
    expect(maskLlmKeyInput('')).toBe('');
    expect(maskLlmKeyInput('s')).toBe('s');
    expect(maskLlmKeyInput('sk')).toBe('sk');
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

  it('resolves a vendor value and rejects an unknown one', () => {
    expect(llmVendorFromValue('zhipu')).toBe(ModelVendor.Zhipu);
    expect(llmVendorFromValue('nope')).toBeNull();
  });

  it('offers the first provider without a key', () => {
    const providers = [
      { vendor: ModelVendor.Anthropic, modelCount: 1 },
      { vendor: ModelVendor.Google, modelCount: 1 },
    ];

    expect(firstVendorWithoutKey(providers, KEYED)).toBe(ModelVendor.Google);
  });

  it('falls back to the first provider once every provider has a key', () => {
    const providers = [
      { vendor: ModelVendor.Anthropic, modelCount: 1 },
      { vendor: ModelVendor.Google, modelCount: 1 },
    ];

    expect(
      firstVendorWithoutKey(providers, [
        ...KEYED,
        { vendor: ModelVendor.Google, last4: '7c19', usedBySteps: 0 },
      ]),
    ).toBe(ModelVendor.Anthropic);
  });

  it('falls back to the default vendor with no providers at all', () => {
    expect(firstVendorWithoutKey([], [])).toBe(ModelVendor.Openai);
  });
});
