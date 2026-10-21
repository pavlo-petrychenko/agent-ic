import { LlmKeyVendor } from '@agent-ic/contracts';
import type {
  LlmKeyCheck,
  LlmKeyOption,
  LlmKeyView,
} from '@/modules/llm-keys/typedefs/llm-key.typedefs';
import { LlmKeyVendor as GraphqlLlmKeyVendor } from '@/platform/graphql-server/generated/schema.generated';
import type {
  LlmKey as GraphqlLlmKey,
  LlmKeyCheck as GraphqlLlmKeyCheck,
  LlmKeyOption as GraphqlLlmKeyOption,
} from '@/platform/graphql-server/generated/schema.generated';

const GRAPHQL_LLM_KEY_VENDOR: Readonly<Record<LlmKeyVendor, GraphqlLlmKeyVendor>> = {
  [LlmKeyVendor.OpenAi]: GraphqlLlmKeyVendor.Openai,
  [LlmKeyVendor.Anthropic]: GraphqlLlmKeyVendor.Anthropic,
  [LlmKeyVendor.Google]: GraphqlLlmKeyVendor.Google,
  [LlmKeyVendor.Mistral]: GraphqlLlmKeyVendor.Mistral,
  [LlmKeyVendor.DeepSeek]: GraphqlLlmKeyVendor.Deepseek,
  [LlmKeyVendor.Custom]: GraphqlLlmKeyVendor.Custom,
};

export const toGraphqlLlmKey = (key: LlmKeyView): GraphqlLlmKey => ({
  id: key.id,
  vendor: GRAPHQL_LLM_KEY_VENDOR[key.vendor],
  name: key.name,
  baseUrl: key.baseUrl,
  keyLast4: key.keyLast4,
  fallbackToPlatform: key.fallbackToPlatform,
  addedBy: key.addedBy,
  createdAt: key.createdAt.toISOString(),
  usedBySteps: key.usedBySteps,
});

export const toGraphqlLlmKeyOption = (option: LlmKeyOption): GraphqlLlmKeyOption => ({
  id: option.id,
  vendor: GRAPHQL_LLM_KEY_VENDOR[option.vendor],
  name: option.name,
});

export const toGraphqlLlmKeyCheck = (check: LlmKeyCheck): GraphqlLlmKeyCheck => ({
  models: [...check.models],
});
