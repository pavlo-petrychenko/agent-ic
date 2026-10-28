import type { Connection } from '@/modules/knowledge/typedefs/connection.typedefs';
import type { Document } from '@/modules/knowledge/typedefs/document.typedefs';
import type { GoogleDriveFile } from '@/modules/knowledge/typedefs/google-drive.typedefs';
import type { KnowledgeBase } from '@/modules/knowledge/typedefs/knowledge-base.typedefs';

export interface KnowledgeCounts {
  readonly documentCount: number;
  readonly chunkCount: number;
}

export interface DocumentIngestionInput {
  readonly workspaceId: string;
  readonly knowledgeBase: KnowledgeBase;
  readonly document: Document;
  readonly connection: Connection | null;
}

export interface DocumentIngestionResult {
  readonly skipped: boolean;
}

export interface SourceIngestionStart {
  readonly knowledgeBase: KnowledgeBase;
  readonly documents: readonly Document[];
  readonly connection: Connection | null;
  readonly syncRunId: string;
}

export interface DocumentOriginalContent {
  readonly storageKey: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly bytes: Buffer;
  readonly googleFile: GoogleDriveFile | null;
}
