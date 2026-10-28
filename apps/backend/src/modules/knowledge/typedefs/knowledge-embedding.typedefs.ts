import type { IndexedDocumentChunk } from '@/modules/knowledge/typedefs/chunk-index.typedefs';
import type { EmbeddingModelId } from '@/platform/llm/constants/llm-model.constants';

export interface KnowledgeEmbeddingInput {
  readonly workspaceId: string;
  readonly model: EmbeddingModelId;
  readonly dimensions: number;
  readonly chunks: readonly IndexedDocumentChunk[];
}

export interface EmbeddedDocumentChunk extends IndexedDocumentChunk {
  readonly embedding: readonly number[];
  readonly embeddingModel: EmbeddingModelId;
  readonly embeddingDimensions: number;
}

export interface KnowledgeEmbeddingResult {
  readonly chunks: readonly EmbeddedDocumentChunk[];
}
