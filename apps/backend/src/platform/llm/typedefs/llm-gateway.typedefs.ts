import type { z } from 'zod';
import type { LlmMessageRole } from '@/platform/llm/constants/llm-gateway.constants';
import type { LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import type { LlmProviderSource } from '@/platform/llm/typedefs/llm-provider.typedefs';

export interface LlmMessage {
  readonly role: LlmMessageRole;
  readonly content: string;
}

export interface LlmTool {
  readonly description: string;
  readonly inputSchema: z.ZodType;
  readonly execute: (input: unknown) => Promise<unknown>;
}

export type LlmTools = Readonly<Record<string, LlmTool>>;

export type LlmTags = Readonly<Record<string, string>>;

export interface LlmReplyRequest<T> {
  readonly provider: LlmProviderSource;
  readonly model: LlmModelId;
  readonly system: string;
  readonly messages: readonly LlmMessage[];
  readonly schema: z.ZodType<T>;
  readonly tools: LlmTools;
  readonly tags: LlmTags;
}

export interface LlmReply<T> {
  readonly value: T;
}
