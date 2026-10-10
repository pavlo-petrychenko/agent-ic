export enum LlmVendor {
  OpenAi = 'openai',
  Anthropic = 'anthropic',
  Mistral = 'mistral',
  Xiaomi = 'xiaomi',
  Google = 'google',
  Zhipu = 'zhipu',
  DeepSeek = 'deepseek',
}

export enum LlmPurpose {
  Conversation = 'conversation',
  Light = 'light',
}

export enum LlmModelId {
  Gpt6Luna = 'gpt-6-luna',
  Ministral14b = 'ministral-14b-2512',
  ClaudeHaiku55 = 'claude-haiku-5-5',
  MimoV26Flash = 'mimo-v2.6-flash',
  Gemma4 = 'gemma-4-26b-a4b-it',
  Glm53Flash = 'glm-5.3-flash',
  DeepSeekV41Flash = 'deepseek/deepseek-v4.1-flash',
}

export enum LlmApi {
  ChatCompletions = 'chat-completions',
  AnthropicMessages = 'anthropic-messages',
}

export enum LlmStructuredOutput {
  JsonSchema = 'json-schema',
  JsonObject = 'json-object',
}

export enum LlmAgentFinish {
  FinalMessage = 'final-message',
  ReplyTool = 'reply-tool',
}

export enum LlmReasoningEffort {
  None = 'none',
  Low = 'low',
}
