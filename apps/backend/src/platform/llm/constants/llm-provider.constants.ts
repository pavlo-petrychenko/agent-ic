import type { AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';
import { LlmApi } from '@/platform/llm/constants/llm-model.constants';
import type { LlmResolvedSource } from '@/platform/llm/typedefs/llm-provider.typedefs';

export enum LlmProviderKind {
  Platform = 'platform',
  Workspace = 'workspace',
}

export const LLM_PLATFORM_PROVIDER_NAME = 'llmapi';

export const LLM_PLATFORM_SOURCE: LlmResolvedSource = { kind: LlmProviderKind.Platform };

export const LLM_PROVIDER_OPTIONS: Readonly<
  Record<
    LlmApi,
    Readonly<Record<string, Pick<AnthropicLanguageModelOptions, 'structuredOutputMode'>>>
  >
> = {
  [LlmApi.ChatCompletions]: {},
  [LlmApi.AnthropicMessages]: { anthropic: { structuredOutputMode: 'outputFormat' } },
};
