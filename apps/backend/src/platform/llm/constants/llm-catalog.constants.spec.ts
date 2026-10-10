import { describe, expect, it } from 'vitest';
import { LLM_CATALOG, LLM_DEFAULT_MODEL } from '@/platform/llm/constants/llm-catalog.constants';
import {
  LLM_REASONING_ORDER,
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

  it.each(models)('gives $id a fallback by another vendor for each of its purposes', (model) => {
    const fallback = LLM_CATALOG[model.fallback];

    expect(fallback).toBeDefined();
    expect(fallback.vendor).not.toBe(model.vendor);
    expect(fallback.purposes).toEqual(expect.arrayContaining([...model.purposes]));
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

  it.each(models)('lists the reasoning levels of $id from lowest to highest', (model) => {
    const ranks = model.reasoningLevels.map((level) => LLM_REASONING_ORDER.indexOf(level));

    expect(ranks).toEqual(ranks.toSorted((left, right) => left - right));
    expect(new Set(ranks).size).toBe(ranks.length);
  });

  it.each(models)('picks the default and tool reasoning of $id from its levels', (model) => {
    const chosen = [model.reasoningEffort, model.reasoningWithTools].filter(
      (level) => level !== null,
    );

    expect(model.reasoningLevels).toEqual(expect.arrayContaining(chosen));
  });

  it.each(Object.values(LlmPurpose))('defaults %s to a catalog model that serves it', (purpose) => {
    expect(LLM_CATALOG[LLM_DEFAULT_MODEL[purpose]].purposes).toContain(purpose);
  });
});
