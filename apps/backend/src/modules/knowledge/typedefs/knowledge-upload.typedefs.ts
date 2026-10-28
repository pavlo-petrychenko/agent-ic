import type { z } from 'zod';
import type { knowledgeUploadTicketSchema } from '@/modules/knowledge/schemas/knowledge-upload.schema';

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
