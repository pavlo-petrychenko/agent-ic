import { describe, expect, it } from 'vitest';
import { LLM_CATALOG, LLM_DEFAULT_MODEL } from '@/platform/llm/constants/llm-catalog.constants';
import {
  LlmApi,
  LlmModelId,
  LlmPurpose,
  LlmStructuredOutput,
} from '@/platform/llm/constants/llm-model.constants';

const models = Object.values(LLM_CATALOG);

describe('LLM_CATALOG', () => {
  it('lists every model under its own id', () => {
    expect(Object.entries(LLM_CATALOG).map(([id, model]) => [id, model.id])).toEqual(
      Object.values(LlmModelId).map((id) => [id, id]),
    );
  });

  it.each(models)('gives $id a fallback by another vendor', (model) => {
    const fallback = LLM_CATALOG[model.fallback];

    expect(fallback).toBeDefined();
    expect(fallback.vendor).not.toBe(model.vendor);
  });

  it.each(models)('prices $id per million tokens above zero', ({ price }) => {
    expect(price.inputUsdPerMillionTokens).toBeGreaterThan(0);
    expect(price.outputUsdPerMillionTokens).toBeGreaterThan(0);
  });

  it.each(models.filter(({ api }) => api === LlmApi.AnthropicMessages))(
    'asks $id for its native output format',
    ({ structuredOutput }) => {
      expect(structuredOutput).toBe(LlmStructuredOutput.JsonSchema);
    },
  );

  it.each(Object.values(LlmPurpose))(
    'defaults %s to a catalog model of that purpose',
    (purpose) => {
      expect(LLM_CATALOG[LLM_DEFAULT_MODEL[purpose]].purpose).toBe(purpose);
    },
  );
});
