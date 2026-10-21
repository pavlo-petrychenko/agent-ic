import { LLM_KEY_MIN_LENGTH, LLM_KEY_NAME_MAX_LENGTH, LlmKeyVendor } from '@agent-ic/contracts';
import { z } from 'zod';
import { LlmKeyField } from '@/modules/llm-keys/constants/llm-key-input.constants';

const knownVendorSchema = z.enum([
  LlmKeyVendor.OpenAi,
  LlmKeyVendor.Anthropic,
  LlmKeyVendor.Google,
  LlmKeyVendor.Mistral,
  LlmKeyVendor.DeepSeek,
]);
const customVendorSchema = z.literal(LlmKeyVendor.Custom);
const apiKeySchema = z.string().trim().min(LLM_KEY_MIN_LENGTH);
const nameSchema = z.string().trim().min(1).max(LLM_KEY_NAME_MAX_LENGTH);
const baseUrlSchema = z.string().trim().min(1);
const recordIdSchema = z.string().min(1);

export const checkLlmKeyInputSchema = z.discriminatedUnion(LlmKeyField.Vendor, [
  z.object({
    [LlmKeyField.Vendor]: knownVendorSchema,
    [LlmKeyField.ApiKey]: apiKeySchema,
  }),
  z.object({
    [LlmKeyField.Vendor]: customVendorSchema,
    [LlmKeyField.ApiKey]: apiKeySchema,
    [LlmKeyField.BaseUrl]: baseUrlSchema,
  }),
]);

export const addLlmKeyInputSchema = z.discriminatedUnion(LlmKeyField.Vendor, [
  z.object({
    [LlmKeyField.Vendor]: knownVendorSchema,
    [LlmKeyField.ApiKey]: apiKeySchema,
    [LlmKeyField.FallbackToPlatform]: z.boolean(),
  }),
  z.object({
    [LlmKeyField.Vendor]: customVendorSchema,
    [LlmKeyField.ApiKey]: apiKeySchema,
    [LlmKeyField.Name]: nameSchema,
    [LlmKeyField.BaseUrl]: baseUrlSchema,
    [LlmKeyField.FallbackToPlatform]: z.boolean(),
  }),
]);

export const setLlmKeyFallbackInputSchema = z.object({
  [LlmKeyField.Id]: recordIdSchema,
  [LlmKeyField.Enabled]: z.boolean(),
});

export const llmKeyIdInputSchema = z.object({
  [LlmKeyField.Id]: recordIdSchema,
});
