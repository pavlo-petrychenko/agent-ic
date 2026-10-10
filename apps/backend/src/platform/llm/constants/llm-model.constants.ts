export enum LlmVendor {
  OpenAi = 'openai',
  Anthropic = 'anthropic',
  Google = 'google',
  DeepSeek = 'deepseek',
}

export enum LlmPurpose {
  Conversation = 'conversation',
  Light = 'light',
}

export enum LlmModelId {
  Gpt54Mini = 'gpt-5.4-mini',
  ClaudeSonnet55 = 'claude-sonnet-5-5',
  Gpt61Sol = 'gpt-6.1-sol',
  Gemini38Flash = 'gemini-3.8-flash',
  DeepSeekV41Flash = 'deepseek/deepseek-v4.1-flash',
  Gemini35FlashLite = 'gemini-3.5-flash-lite',
  Gpt56Luna = 'gpt-5.6-luna',
  Gpt54Nano = 'gpt-5.4-nano',
}
