import { LlmKeyVendor } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { LLM_CATALOG } from '@/platform/llm/constants/llm-catalog.constants';
import {
  LlmAgentFinish,
  LlmModelId,
  LlmStructuredOutput,
} from '@/platform/llm/constants/llm-model.constants';
import {
  LLM_PLATFORM_SOURCE,
  LlmProviderKind,
} from '@/platform/llm/constants/llm-provider.constants';
import { LLM_VENDOR_PROFILE } from '@/platform/llm/constants/llm-vendor-profile.constants';
import { LlmModelUnknownError } from '@/platform/llm/errors/llm-model-unknown.error';
import { profileFor } from '@/platform/llm/helpers/llm-model-profile.helpers';
import type { LlmResolvedSource } from '@/platform/llm/typedefs/llm-provider.typedefs';

const UNKNOWN_MODEL = 'gpt-unknown-mini';
const DEEPSEEK_VENDOR_ID = 'deepseek-v4.1-flash';
const ROUTED_DEEPSEEK_ID = 'acme/deepseek-v4.1-flash';

const keySource = (vendor: LlmKeyVendor): LlmResolvedSource => ({
  kind: LlmProviderKind.Workspace,
  key: {
    id: 'key-profile',
    vendor,
    baseUrl: null,
    apiKey: 'sk-profile',
    fallbackToPlatform: false,
  },
});

describe('profileFor', () => {
  it('reads a platform model from the catalog', () => {
    expect(profileFor(LLM_PLATFORM_SOURCE, LlmModelId.Ministral14b)).toBe(
      LLM_CATALOG[LlmModelId.Ministral14b],
    );
  });

  it('refuses a platform model that is not in the catalog', () => {
    expect(() => profileFor(LLM_PLATFORM_SOURCE, UNKNOWN_MODEL)).toThrow(LlmModelUnknownError);
  });

  it('runs a key model the catalog knows by id with the catalog settings, without a fallback', () => {
    const catalog = LLM_CATALOG[LlmModelId.ClaudeHaiku55];

    expect(profileFor(keySource(LlmKeyVendor.Anthropic), LlmModelId.ClaudeHaiku55)).toEqual({
      id: LlmModelId.ClaudeHaiku55,
      label: catalog.label,
      vendor: catalog.vendor,
      api: catalog.api,
      structuredOutput: catalog.structuredOutput,
      agentFinish: catalog.agentFinish,
      reasoningLevels: catalog.reasoningLevels,
      reasoningEffort: catalog.reasoningEffort,
      price: catalog.price,
      fallback: null,
    });
  });

  it.each([DEEPSEEK_VENDOR_ID, ROUTED_DEEPSEEK_ID])(
    'matches the key model %s to the catalog by its last path segment and keeps its id',
    (model) => {
      const profile = profileFor(keySource(LlmKeyVendor.DeepSeek), model);

      expect(profile).toMatchObject({
        id: model,
        label: LLM_CATALOG[LlmModelId.DeepSeekV41Flash].label,
        reasoningLevels: LLM_CATALOG[LlmModelId.DeepSeekV41Flash].reasoningLevels,
      });
    },
  );

  it('does not match a catalog model of another vendor', () => {
    expect(profileFor(keySource(LlmKeyVendor.OpenAi), LlmModelId.ClaudeHaiku55)).toEqual({
      ...LLM_VENDOR_PROFILE[LlmKeyVendor.OpenAi],
      id: LlmModelId.ClaudeHaiku55,
      label: LlmModelId.ClaudeHaiku55,
    });
  });

  it.each([
    [LlmKeyVendor.OpenAi, LlmStructuredOutput.JsonSchema, LlmAgentFinish.FinalMessage],
    [LlmKeyVendor.Anthropic, LlmStructuredOutput.JsonSchema, LlmAgentFinish.FinalMessage],
    [LlmKeyVendor.Google, LlmStructuredOutput.JsonSchema, LlmAgentFinish.FinalMessage],
    [LlmKeyVendor.Mistral, LlmStructuredOutput.JsonSchema, LlmAgentFinish.FinalMessage],
    [LlmKeyVendor.DeepSeek, LlmStructuredOutput.JsonObject, LlmAgentFinish.ReplyTool],
    [LlmKeyVendor.Custom, LlmStructuredOutput.JsonObject, LlmAgentFinish.ReplyTool],
  ])(
    'runs an unknown %s model on the vendor profile, %s with %s',
    (vendor, structuredOutput, agentFinish) => {
      expect(profileFor(keySource(vendor), UNKNOWN_MODEL)).toEqual({
        id: UNKNOWN_MODEL,
        label: UNKNOWN_MODEL,
        vendor: LLM_VENDOR_PROFILE[vendor].vendor,
        api: LLM_VENDOR_PROFILE[vendor].api,
        structuredOutput,
        agentFinish,
        reasoningLevels: [],
        reasoningEffort: null,
        price: null,
        fallback: null,
      });
    },
  );
});
