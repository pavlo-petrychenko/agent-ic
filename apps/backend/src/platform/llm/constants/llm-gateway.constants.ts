export enum LlmMessageRole {
  User = 'user',
  Assistant = 'assistant',
}

export const LLM_REPLY_TOOL_NAME = 'reply';
export const LLM_REPLY_TOOL_DESCRIPTION =
  'Give your final answer by calling this tool once, with arguments that match its schema.';
export const LLM_REPLY_ATTEMPTS = 2;
export const LLM_MAX_TOOL_ROUNDS = 8;
export const LLM_SDK_MAX_RETRIES = 0;
export const LLM_REPLY_INVALID_FEEDBACK =
  'The reply arguments do not match the schema. Call the reply tool again with fixed arguments.';

export const LLM_NOT_CONFIGURED_MESSAGE = 'The LLM provider is not configured';
export const LLM_REPLY_INVALID_MESSAGE = 'The LLM reply does not match the schema';
export const LLM_REPLY_MISSING_MESSAGE = 'The LLM answered without calling the reply tool';
