import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { LlmApi } from '@/platform/llm/constants/llm-model.constants';
import { LLM_PLATFORM_PROVIDER_NAME } from '@/platform/llm/constants/llm-provider.constants';
import type { LlmPlatformModels } from '@/platform/llm/typedefs/llm-provider.typedefs';

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
