export const MOCK_LLM_HOST = '127.0.0.1';
export const MOCK_LLM_ANY_PORT = 0;
export const MOCK_LLM_BASE_PATH = '/v1';
export const MOCK_LLM_URL_PROTOCOL = 'http:';

export enum MockLlmRoute {
  ChatCompletions = '/v1/chat/completions',
  Embeddings = '/v1/embeddings',
}

export enum MockLlmStepKind {
  Reply = 'reply',
  Text = 'text',
  Fail = 'fail',
  Hang = 'hang',
  Embed = 'embed',
}

export const MOCK_LLM_REPLY_TOOL = 'reply';
export const MOCK_LLM_COMPLETION_ID = 'chatcmpl-mock';
export const MOCK_LLM_TOOL_CALL_ID = 'call-mock';
export const MOCK_LLM_CREATED_AT = 1_767_225_600;
export const MOCK_LLM_ASSISTANT_ROLE = 'assistant';
export const MOCK_LLM_TOOL_CALL_TYPE = 'function';
export const MOCK_LLM_JSON_CONTENT_TYPE = 'application/json';

export enum MockLlmObject {
  ChatCompletion = 'chat.completion',
  List = 'list',
  Embedding = 'embedding',
}

export enum MockLlmFinishReason {
  Stop = 'stop',
  ToolCalls = 'tool_calls',
}

export const MOCK_LLM_DEFAULT_USAGE = { promptTokens: 10, completionTokens: 5 } as const;
export const MOCK_EMBEDDING_DIMENSIONS = 1024;
export const MOCK_EMBEDDING_TOKENS_PER_INPUT = 1;
export const MOCK_EMBEDDING_STEP = 0.001;

export const MOCK_LLM_UNSCRIPTED_MESSAGE = 'mock llm has no scripted step for this request';
export const MOCK_LLM_WRONG_STEP_MESSAGE = 'mock llm scripted step does not fit this request';
export const MOCK_LLM_FAILURE_MESSAGE = 'mock llm scripted failure';
export const MOCK_LLM_CONTENT_TYPE_HEADER = 'content-type';
