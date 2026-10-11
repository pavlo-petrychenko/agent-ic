import type { AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';
import { LlmApi } from '@/platform/llm/constants/llm-model.constants';

export enum LlmProviderKind {
  Platform = 'platform',
  Workspace = 'workspace',
}

export const LLM_PLATFORM_PROVIDER_NAME = 'llmapi';

export const LLM_PROVIDER_OPTIONS: Readonly<
  Record<
    LlmApi,
    Readonly<Record<string, Pick<AnthropicLanguageModelOptions, 'structuredOutputMode'>>>
  >
> = {
  [LlmApi.ChatCompletions]: {},
  [LlmApi.AnthropicMessages]: { anthropic: { structuredOutputMode: 'outputFormat' } },
};
