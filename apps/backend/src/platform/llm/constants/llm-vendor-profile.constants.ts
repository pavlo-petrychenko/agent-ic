import { LlmKeyVendor } from '@agent-ic/contracts';
import {
  LlmAgentFinish,
  LlmApi,
  LlmStructuredOutput,
  LlmVendor,
} from '@/platform/llm/constants/llm-model.constants';
import type { LlmVendorProfile } from '@/platform/llm/typedefs/llm-model.typedefs';

export const LLM_MODEL_PATH_SEPARATOR = '/';

const UNPRICED_WITHOUT_REASONING = {
  reasoningLevels: [],
  reasoningEffort: null,
  price: null,
  fallback: null,
} as const;

const FINAL_MESSAGE_ON_SCHEMA = {
  structuredOutput: LlmStructuredOutput.JsonSchema,
  agentFinish: LlmAgentFinish.FinalMessage,
} as const;

const REPLY_TOOL_ON_JSON_OBJECT = {
  structuredOutput: LlmStructuredOutput.JsonObject,
  agentFinish: LlmAgentFinish.ReplyTool,
} as const;

export const LLM_VENDOR_PROFILE: Readonly<Record<LlmKeyVendor, LlmVendorProfile>> = {
  [LlmKeyVendor.OpenAi]: {
    vendor: LlmVendor.OpenAi,
    api: LlmApi.ChatCompletions,
    ...FINAL_MESSAGE_ON_SCHEMA,
    ...UNPRICED_WITHOUT_REASONING,
  },
  [LlmKeyVendor.Anthropic]: {
    vendor: LlmVendor.Anthropic,
    api: LlmApi.AnthropicMessages,
    ...FINAL_MESSAGE_ON_SCHEMA,
    ...UNPRICED_WITHOUT_REASONING,
  },
  [LlmKeyVendor.Google]: {
    vendor: LlmVendor.Google,
    api: LlmApi.ChatCompletions,
    ...FINAL_MESSAGE_ON_SCHEMA,
    ...UNPRICED_WITHOUT_REASONING,
  },
  [LlmKeyVendor.Mistral]: {
    vendor: LlmVendor.Mistral,
    api: LlmApi.ChatCompletions,
    ...FINAL_MESSAGE_ON_SCHEMA,
    ...UNPRICED_WITHOUT_REASONING,
  },
  [LlmKeyVendor.DeepSeek]: {
    vendor: LlmVendor.DeepSeek,
    api: LlmApi.ChatCompletions,
    ...REPLY_TOOL_ON_JSON_OBJECT,
    ...UNPRICED_WITHOUT_REASONING,
  },
  [LlmKeyVendor.Custom]: {
    vendor: LlmKeyVendor.Custom,
    api: LlmApi.ChatCompletions,
    ...REPLY_TOOL_ON_JSON_OBJECT,
    ...UNPRICED_WITHOUT_REASONING,
  },
};
