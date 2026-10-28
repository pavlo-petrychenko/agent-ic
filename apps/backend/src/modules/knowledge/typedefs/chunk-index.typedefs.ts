import type { DocumentChunk } from '@/modules/knowledge/typedefs/document-chunk.typedefs';
import type { DocumentSection } from '@/modules/knowledge/typedefs/document-section.typedefs';

export interface ChunkIndexInput {
  readonly title: string;
  readonly summary?: string | null;
  readonly sections: readonly DocumentSection[];
  readonly chunks: readonly DocumentChunk[];
}

export interface IndexedDocumentChunk extends DocumentChunk {
  readonly indexText: string;
  readonly contentHash: string;
}
