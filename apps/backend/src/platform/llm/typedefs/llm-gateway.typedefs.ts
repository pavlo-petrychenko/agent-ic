import type { ReasoningLevel } from '@agent-ic/contracts';
import type {
  JSONSchema7,
  LanguageModel,
  LanguageModelUsage,
  ModelMessage,
  TelemetryOptions,
} from 'ai';
import type { z } from 'zod';
import type {
  LlmMessageRole,
  LlmToolCallStatus,
} from '@/platform/llm/constants/llm-gateway.constants';
import type { LlmPurpose } from '@/platform/llm/constants/llm-model.constants';
import type { LlmModelProfile } from '@/platform/llm/typedefs/llm-model.typedefs';
import type {
  LlmProviderSource,
  LlmResolvedSource,
} from '@/platform/llm/typedefs/llm-provider.typedefs';
import type { LlmTags } from '@/platform/llm/typedefs/llm-tracing.typedefs';

export interface LlmMessage {
  readonly role: LlmMessageRole;
  readonly content: string;
}

export interface LlmCompleteRequest<T> {
  readonly provider: LlmProviderSource;
  readonly model: string;
  readonly purpose: LlmPurpose;
  readonly system: string;
  readonly messages: readonly LlmMessage[];
  readonly output: z.ZodType<T>;
  readonly reasoning?: ReasoningLevel;
  readonly tags: LlmTags;
}

export interface LlmTool {
  readonly description: string;
  readonly inputSchema: z.ZodType;
  readonly execute: (input: unknown) => Promise<unknown>;
  readonly failed?: (output: unknown) => boolean;
}

export type LlmTools = Readonly<Record<string, LlmTool>>;

export interface LlmAgentProgress {
  readonly messages: readonly ModelMessage[];
  readonly roundsUsed: number;
  readonly toolCalls: readonly LlmToolCall[];
}

export interface LlmAgentRequest<T> extends LlmCompleteRequest<T> {
  readonly tools: LlmTools;
  readonly maxToolRounds: number;
  readonly resumeFrom?: LlmAgentProgress;
  readonly onProgress?: (progress: LlmAgentProgress) => void;
}

export interface LlmToolCall {
  readonly name: string;
  readonly input: unknown;
  readonly status: LlmToolCallStatus;
  readonly output: unknown;
  readonly error: string | null;
  readonly durationMs: number | null;
}

export interface LlmUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export interface LlmCompletion<T> {
  readonly output: T;
  readonly model: string;
  readonly usage: LlmUsage;
}

export interface LlmModelRun {
  readonly source: LlmResolvedSource;
  readonly model: LlmModelProfile;
  readonly languageModel: LanguageModel;
  readonly jsonSchema: JSONSchema7;
  readonly stepTimeoutMs: number;
  readonly reasoning: ReasoningLevel | null;
  readonly telemetry: TelemetryOptions;
}

export type LlmStepTimeouts = Readonly<Record<LlmPurpose, number>>;

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

export type LlmRunTracker = (state: LlmRunState) => LlmRunState;

export interface LlmStepToolCall {
  readonly toolCallId: string;
  readonly toolName: string;
  readonly input: unknown;
}

export interface LlmStepContentPart {
  readonly type: string;
  readonly toolCallId?: string;
  readonly output?: unknown;
  readonly error?: unknown;
}

export interface LlmStep {
  readonly response: { readonly messages: readonly ModelMessage[] };
  readonly toolCalls: readonly LlmStepToolCall[];
  readonly content: readonly LlmStepContentPart[];
  readonly performance: { readonly toolExecutionMs: Readonly<Record<string, number>> };
  readonly usage: LanguageModelUsage;
}

export interface LlmRounds<R> {
  readonly result: R;
  readonly next: LlmRunState;
}
