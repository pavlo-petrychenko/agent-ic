import { LlmKeyVendor } from '@agent-ic/contracts';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel } from 'ai';
import { LlmApi } from '@/platform/llm/constants/llm-model.constants';
import type { EmbeddingModelId } from '@/platform/llm/constants/llm-model.constants';
import { LLM_PLATFORM_PROVIDER_NAME } from '@/platform/llm/constants/llm-provider.constants';
import { LlmKeyEndpointBlockedError } from '@/platform/llm/errors/llm-key-endpoint-blocked.error';
import type {
  LlmPlatformEmbeddings,
  LlmPlatformModels,
  LlmWorkspaceKey,
} from '@/platform/llm/typedefs/llm-provider.typedefs';

export const platformModels = (baseURL: string, apiKey: string): LlmPlatformModels => {
  const chatCompletions = createOpenAICompatible({
    name: LLM_PLATFORM_PROVIDER_NAME,
    baseURL,
    apiKey,
    supportsStructuredOutputs: true,
  });
  const anthropicMessages = createAnthropic({ baseURL, apiKey });
  return {
    [LlmApi.ChatCompletions]: (model) => chatCompletions.chatModel(model),
    [LlmApi.AnthropicMessages]: (model) => anthropicMessages.languageModel(model),
  };
};

export const platformEmbeddings = (baseURL: string, apiKey: string): LlmPlatformEmbeddings => {
  const provider = createOpenAICompatible({ name: LLM_PLATFORM_PROVIDER_NAME, baseURL, apiKey });
  return (model: EmbeddingModelId) => provider.embeddingModel(model);
};

export const workspaceLanguageModel = (
  { vendor, apiKey, baseUrl }: LlmWorkspaceKey,
  model: string,
  guardedFetch: typeof fetch,
): LanguageModel => {
  switch (vendor) {
    case LlmKeyVendor.OpenAi:
      return createOpenAI({ apiKey }).chat(model);
    case LlmKeyVendor.Anthropic:
      return createAnthropic({ apiKey }).languageModel(model);
    case LlmKeyVendor.Google:
      return createGoogleGenerativeAI({ apiKey }).languageModel(model);
    case LlmKeyVendor.Mistral:
      return createMistral({ apiKey }).languageModel(model);
    case LlmKeyVendor.DeepSeek:
      return createDeepSeek({ apiKey }).languageModel(model);
    case LlmKeyVendor.Custom:
      if (baseUrl === null) {
        throw new LlmKeyEndpointBlockedError(vendor);
      }
      return createOpenAICompatible({
        name: LlmKeyVendor.Custom,
        baseURL: baseUrl,
        apiKey,
        fetch: guardedFetch,
      }).chatModel(model);
  }
};
