import type { LlmUsage } from '@/platform/llm/typedefs/llm-gateway.typedefs';

export enum LlmMessageRole {
  User = 'user',
  Assistant = 'assistant',
}

export const LLM_OUTPUT_ATTEMPTS = 2;
export const LLM_SDK_MAX_RETRIES = 0;
export const LLM_NO_USAGE: LlmUsage = { inputTokens: 0, outputTokens: 0 };
export const LLM_JSON_OBJECT_INSTRUCTION =
  'Answer with one JSON object and nothing else. It must match this JSON Schema:';
export const LLM_OUTPUT_INVALID_FEEDBACK =
  'Your answer does not match the required JSON schema. Answer again with JSON that matches it.';
export const LLM_OUTPUT_NOT_JSON = 'The answer is not valid JSON';

export const LLM_NOT_CONFIGURED_MESSAGE = 'The LLM provider is not configured';
export const LLM_OUTPUT_INVALID_MESSAGE = 'The LLM answer does not match the schema';
