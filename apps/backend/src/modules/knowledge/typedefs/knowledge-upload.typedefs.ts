import type { z } from 'zod';
import type { knowledgeUploadTicketSchema } from '@/modules/knowledge/schemas/knowledge-upload.schema';
import type { Document } from '@/modules/knowledge/typedefs/document.typedefs';
import type { Source } from '@/modules/knowledge/typedefs/source.typedefs';

export type KnowledgeUploadTicket = z.infer<typeof knowledgeUploadTicketSchema>;

export interface CreateUploadInput {
  readonly knowledgeBaseId: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly sourceId?: string | null;
}

export interface CreateUploadResult {
  readonly documentId: string;
  readonly uploadUrl: string;
}

export interface ConfirmUploadInput {
  readonly documentId: string;
}

export interface KnowledgeUploadTarget {
  readonly source: Source;
  readonly document: Document;
}

export interface ConfirmedKnowledgeUpload {
  readonly source: Source;
  readonly document: Document;
  readonly discardedStorageKeys: readonly string[];
}
