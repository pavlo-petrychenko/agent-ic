import type { JSONSchema7, LanguageModel } from 'ai';
import type { z } from 'zod';
import type { LlmMessageRole } from '@/platform/llm/constants/llm-gateway.constants';
import type { LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import type { LlmModel } from '@/platform/llm/typedefs/llm-model.typedefs';
import type { LlmProviderSource } from '@/platform/llm/typedefs/llm-provider.typedefs';

export interface LlmMessage {
  readonly role: LlmMessageRole;
  readonly content: string;
}

export type LlmTags = Readonly<Record<string, string>>;

export interface LlmCompleteRequest<T> {
  readonly provider: LlmProviderSource;
  readonly model: LlmModelId;
  readonly system: string;
  readonly messages: readonly LlmMessage[];
  readonly output: z.ZodType<T>;
  readonly tags: LlmTags;
}

export interface LlmUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export interface LlmCompletion<T> {
  readonly output: T;
  readonly model: LlmModelId;
  readonly usage: LlmUsage;
}

export interface LlmModelRun {
  readonly model: LlmModel;
  readonly languageModel: LanguageModel;
  readonly jsonSchema: JSONSchema7;
}
