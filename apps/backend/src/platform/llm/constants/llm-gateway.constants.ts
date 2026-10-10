import type { LlmUsage } from '@/platform/llm/typedefs/llm-gateway.typedefs';

export enum LlmMessageRole {
  User = 'user',
  Assistant = 'assistant',
}

export const LLM_OUTPUT_RETRIES = 1;
export const LLM_REPLY_NUDGES = 1;
export const LLM_COMPLETE_ROUNDS = LLM_OUTPUT_RETRIES + 1;
export const LLM_SDK_MAX_RETRIES = 0;
export const LLM_NO_USAGE: LlmUsage = { inputTokens: 0, outputTokens: 0 };
export const LLM_JSON_OBJECT_INSTRUCTION =
  'Answer with one JSON object and nothing else. It must match this JSON Schema:';
export const LLM_OUTPUT_INVALID_FEEDBACK =
  'Your answer does not match the required JSON schema. Answer again with JSON that matches it.';
export const LLM_OUTPUT_NOT_JSON = 'The answer is not valid JSON';
export const LLM_REPLY_TOOL_NAME = 'reply';
export const LLM_REPLY_TOOL_DESCRIPTION =
  'Give your final answer by calling this tool once, with arguments that match its schema.';
export const LLM_REPLY_INVALID_FEEDBACK =
  'The reply arguments do not match the schema. Call the reply tool again with fixed arguments.';
export const LLM_REPLY_NUDGE = 'Give your final answer now by calling the reply tool.';
export const LLM_TOOL_CALLS_FINISH_REASON = 'tool-calls';

export const LLM_NOT_CONFIGURED_MESSAGE = 'The LLM provider is not configured';
export const LLM_OUTPUT_INVALID_MESSAGE = 'The LLM answer does not match the schema';
export const LLM_REPLY_MISSING_MESSAGE = 'The LLM ended without calling the reply tool';
export const LLM_TOOL_ROUNDS_EXCEEDED_MESSAGE = 'The LLM kept calling tools past the round limit';
