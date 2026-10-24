export enum LlmKeyVendor {
  OpenAi = 'openai',
  Anthropic = 'anthropic',
  Google = 'google',
  Mistral = 'mistral',
  DeepSeek = 'deepseek',
  Custom = 'custom',
}

export const LLM_KEY_NAME_MAX_LENGTH = 60;
export const LLM_KEY_MIN_LENGTH = 8;
