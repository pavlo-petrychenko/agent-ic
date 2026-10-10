import type { JSONSchema7, LanguageModel, LanguageModelUsage, ModelMessage } from 'ai';
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

export interface LlmTool {
  readonly description: string;
  readonly inputSchema: z.ZodType;
  readonly execute: (input: unknown) => Promise<unknown>;
}

export type LlmTools = Readonly<Record<string, LlmTool>>;

export interface LlmAgentRequest<T> extends LlmCompleteRequest<T> {
  readonly tools: LlmTools;
  readonly maxToolRounds: number;
}

export interface LlmToolCall {
  readonly name: string;
  readonly input: unknown;
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

export interface LlmAgentResult<T> extends LlmCompletion<T> {
  readonly toolCalls: readonly LlmToolCall[];
}

export interface LlmRunState {
  readonly messages: readonly ModelMessage[];
  readonly roundsLeft: number;
  readonly retriesLeft: number;
  readonly nudgesLeft: number;
  readonly usage: LlmUsage;
  readonly toolCalls: readonly LlmToolCall[];
}

export interface LlmStepsResult {
  readonly response: { readonly messages: readonly ModelMessage[] };
  readonly steps: readonly {
    readonly toolCalls: readonly { readonly toolName: string; readonly input: unknown }[];
  }[];
  readonly totalUsage: LanguageModelUsage;
}
