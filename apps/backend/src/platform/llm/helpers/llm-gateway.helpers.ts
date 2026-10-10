import { Output } from 'ai';
import type {
  JSONSchema7,
  LanguageModelUsage,
  ModelMessage,
  OutputInterface,
  UserModelMessage,
} from 'ai';
import { z } from 'zod';
import {
  LLM_JSON_OBJECT_INSTRUCTION,
  LLM_OUTPUT_INVALID_FEEDBACK,
  LlmMessageRole,
} from '@/platform/llm/constants/llm-gateway.constants';
import { LlmStructuredOutput } from '@/platform/llm/constants/llm-model.constants';
import { LLM_PROVIDER_OPTIONS } from '@/platform/llm/constants/llm-provider.constants';
import { jsonTextSchema } from '@/platform/llm/schemas/llm-output.schema';
import type { LlmMessage, LlmUsage } from '@/platform/llm/typedefs/llm-gateway.typedefs';
import type { LlmModel } from '@/platform/llm/typedefs/llm-model.typedefs';

export const toModelMessages = (messages: readonly LlmMessage[]): ModelMessage[] =>
  messages.map(({ role, content }) => ({ role, content }));

export const structuredOutput = (
  model: LlmModel,
  schema: JSONSchema7,
): OutputInterface<string, string, never> => ({
  ...Output.text(),
  responseFormat: Promise.resolve(
    model.structuredOutput === LlmStructuredOutput.JsonSchema
      ? { type: 'json', schema }
      : { type: 'json' },
  ),
});

export const outputInstructions = (system: string, model: LlmModel, schema: JSONSchema7): string =>
  model.structuredOutput === LlmStructuredOutput.JsonObject
    ? `${system}\n\n${LLM_JSON_OBJECT_INSTRUCTION}\n${JSON.stringify(schema)}`
    : system;

export const modelCallSettings = (model: LlmModel) => ({
  providerOptions: LLM_PROVIDER_OPTIONS[model.api],
  ...(model.reasoningEffort === null ? {} : { reasoning: model.reasoningEffort }),
});

export const checkOutput = <T>(text: string, schema: z.ZodType<T>) =>
  jsonTextSchema.pipe(schema).safeParse(text);

export const outputFeedbackMessage = (error: z.ZodError): UserModelMessage => ({
  role: LlmMessageRole.User,
  content: `${LLM_OUTPUT_INVALID_FEEDBACK}\n${z.prettifyError(error)}`,
});

export const addUsage = (usage: LlmUsage, step: LanguageModelUsage): LlmUsage => ({
  inputTokens: usage.inputTokens + (step.inputTokens ?? 0),
  outputTokens: usage.outputTokens + (step.outputTokens ?? 0),
});
