import { ErrorReason, LlmKeyVendor } from '@agent-ic/contracts';
import type { z } from 'zod';
import {
  LLM_KEY_FIELD_PATH_SEPARATOR,
  LLM_KEY_FIELD_REASON,
} from '@/modules/llm-keys/constants/llm-key-input.constants';
import { LLM_KEY_VENDOR_NAMES } from '@/modules/llm-keys/constants/llm-key.constants';
import { InvalidLlmKeyInputError } from '@/modules/llm-keys/errors/invalid-llm-key-input.error';
import type {
  LlmKeyProbeInput,
  NewLlmKeyFields,
  ParsedAddLlmKeyInput,
  ParsedCheckLlmKeyInput,
} from '@/modules/llm-keys/typedefs/llm-key.typedefs';
import type { FieldIssue } from '@/platform/errors/typedefs/domain-error.typedefs';

const toFieldIssue = (issue: z.core.$ZodIssue): FieldIssue => ({
  path: issue.path.map(String).join(LLM_KEY_FIELD_PATH_SEPARATOR),
  reason: LLM_KEY_FIELD_REASON[String(issue.path[0] ?? '')] ?? ErrorReason.InvalidRequest,
});

export const parseLlmKeyInput = <TOutput>(schema: z.ZodType<TOutput>, input: unknown): TOutput => {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new InvalidLlmKeyInputError(result.error.issues.map(toFieldIssue));
  }
  return result.data;
};

export const toProbeInput = (
  input: ParsedCheckLlmKeyInput | ParsedAddLlmKeyInput,
): LlmKeyProbeInput =>
  input.vendor === LlmKeyVendor.Custom
    ? { vendor: input.vendor, apiKey: input.apiKey, baseUrl: input.baseUrl }
    : { vendor: input.vendor, apiKey: input.apiKey, baseUrl: null };

export const toNewKeyFields = (input: ParsedAddLlmKeyInput): NewLlmKeyFields =>
  input.vendor === LlmKeyVendor.Custom
    ? {
        vendor: input.vendor,
        apiKey: input.apiKey,
        name: input.name,
        baseUrl: input.baseUrl,
        fallbackToPlatform: input.fallbackToPlatform,
      }
    : {
        vendor: input.vendor,
        apiKey: input.apiKey,
        name: LLM_KEY_VENDOR_NAMES[input.vendor],
        baseUrl: null,
        fallbackToPlatform: input.fallbackToPlatform,
      };
