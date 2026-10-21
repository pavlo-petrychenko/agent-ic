import { LlmKeyVendor } from '@agent-ic/contracts';
import type {
  LlmKnownKeyVendor,
  LlmVendorEndpoint,
} from '@/platform/llm/typedefs/llm-model-list.typedefs';

export enum LlmEndpointAuth {
  Bearer = 'bearer',
  XApiKey = 'x-api-key',
  GoogApiKey = 'x-goog-api-key',
}

export enum LlmEndpointHeader {
  Authorization = 'authorization',
  XApiKey = 'x-api-key',
  GoogApiKey = 'x-goog-api-key',
  AnthropicVersion = 'anthropic-version',
}

export const LLM_BEARER_PREFIX = 'Bearer ';
export const LLM_ANTHROPIC_API_VERSION = '2023-06-01';
export const LLM_CUSTOM_MODELS_PATH = '/models';
export const LLM_URL_TRAILING_SLASHES = /\/+$/;
export const LLM_MODEL_LIST_TIMEOUT_MS = 10_000;
export const LLM_MODEL_LIST_MAX_BYTES = 4 * 1_024 * 1_024;
export const LLM_GOOGLE_MODEL_NAME_PREFIX = 'models/';
export const LLM_GOOGLE_CHAT_METHOD = 'generateContent';

export const LLM_VENDOR_ENDPOINTS: Readonly<Record<LlmKnownKeyVendor, LlmVendorEndpoint>> = {
  [LlmKeyVendor.OpenAi]: {
    baseUrl: 'https://api.openai.com/v1',
    modelsPath: '/models',
    auth: LlmEndpointAuth.Bearer,
    headers: {},
  },
  [LlmKeyVendor.Anthropic]: {
    baseUrl: 'https://api.anthropic.com/v1',
    modelsPath: '/models?limit=1000',
    auth: LlmEndpointAuth.XApiKey,
    headers: { [LlmEndpointHeader.AnthropicVersion]: LLM_ANTHROPIC_API_VERSION },
  },
  [LlmKeyVendor.Google]: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    modelsPath: '/models?pageSize=1000',
    auth: LlmEndpointAuth.GoogApiKey,
    headers: {},
  },
  [LlmKeyVendor.Mistral]: {
    baseUrl: 'https://api.mistral.ai/v1',
    modelsPath: '/models',
    auth: LlmEndpointAuth.Bearer,
    headers: {},
  },
  [LlmKeyVendor.DeepSeek]: {
    baseUrl: 'https://api.deepseek.com',
    modelsPath: '/models',
    auth: LlmEndpointAuth.Bearer,
    headers: {},
  },
};

export const LLM_MODEL_ID_EXCLUDED_FRAGMENTS: readonly string[] = [
  'embed',
  'whisper',
  'tts',
  'dall-e',
  'moderation',
  'image',
  'audio',
  'realtime',
  'transcribe',
  'aqa',
];
