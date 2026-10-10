import { describe, expect, it } from 'vitest';
import { LLM_CATALOG, LLM_DEFAULT_MODEL } from '@/platform/llm/constants/llm-catalog.constants';
import { LlmModelId, LlmPurpose } from '@/platform/llm/constants/llm-model.constants';

const models = Object.values(LLM_CATALOG);

describe('LLM_CATALOG', () => {
  it('lists every model under its own id', () => {
    expect(Object.entries(LLM_CATALOG).map(([id, model]) => [id, model.id])).toEqual(
      Object.values(LlmModelId).map((id) => [id, id]),
    );
  });

  it.each(models)('gives $id a fallback of the same purpose by another vendor', (model) => {
    const fallback = LLM_CATALOG[model.fallback];

    expect(fallback).toBeDefined();
    expect(fallback.vendor).not.toBe(model.vendor);
    expect(fallback.purpose).toBe(model.purpose);
  });

  it.each(models)('prices $id per million tokens above zero', ({ price }) => {
    expect(price.inputUsdPerMillionTokens).toBeGreaterThan(0);
    expect(price.outputUsdPerMillionTokens).toBeGreaterThan(0);
  });

  it.each(Object.values(LlmPurpose))(
    'defaults %s to a catalog model of that purpose',
    (purpose) => {
      expect(LLM_CATALOG[LLM_DEFAULT_MODEL[purpose]].purpose).toBe(purpose);
    },
  );
});
