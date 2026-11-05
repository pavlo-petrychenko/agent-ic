import type { Chunk } from '@/modules/knowledge/typedefs/chunk.typedefs';
import type { Document } from '@/modules/knowledge/typedefs/document.typedefs';
import type { KnowledgeBase } from '@/modules/knowledge/typedefs/knowledge-base.typedefs';
import type { Section } from '@/modules/knowledge/typedefs/section.typedefs';

export interface ReindexKnowledgeDocumentInput {
  readonly workspaceId: string;
  readonly documentId: string;
}

export interface LoadedKnowledgeDocument {
  readonly document: Document;
  readonly knowledgeBase: KnowledgeBase;
  readonly sections: readonly Section[];
  readonly chunks: readonly Chunk[];
}
