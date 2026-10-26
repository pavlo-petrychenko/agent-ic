import type { Document } from '@/modules/knowledge/typedefs/document.typedefs';
import type { KnowledgeBase } from '@/modules/knowledge/typedefs/knowledge-base.typedefs';

export interface KnowledgeCounts {
  readonly documentCount: number;
  readonly chunkCount: number;
}

export interface DocumentIngestionInput {
  readonly workspaceId: string;
  readonly knowledgeBase: KnowledgeBase;
  readonly document: Document;
}

export interface DocumentIngestionResult {
  readonly skipped: boolean;
}
