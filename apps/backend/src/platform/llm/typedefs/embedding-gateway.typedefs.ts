import type { EmbeddingModelId } from '@/platform/llm/constants/llm-model.constants';
import type { LlmTags } from '@/platform/llm/typedefs/llm-tracing.typedefs';

export interface EmbedOptions {
  readonly model: EmbeddingModelId;
  readonly tags: LlmTags;
}

export interface EmbeddingResult {
  readonly vectors: readonly (readonly number[])[];
  readonly model: EmbeddingModelId;
  readonly dimensions: number;
  readonly tokens: number;
}

export interface EmbeddingBatch {
  readonly embeddings: readonly (readonly number[])[];
  readonly tokens: number;
}
