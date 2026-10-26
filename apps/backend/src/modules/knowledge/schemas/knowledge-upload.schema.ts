import { KNOWLEDGE_DOCUMENT_MAX_BYTES } from '@agent-ic/contracts';
import { z } from 'zod';
import {
  KNOWLEDGE_UPLOAD_FILE_NAME_MAX_LENGTH,
  KNOWLEDGE_UPLOAD_MIME_TYPE_MAX_LENGTH,
} from '@/modules/knowledge/constants/knowledge-upload.constants';

export const knowledgeUploadTicketSchema = z.object({
  workspaceId: z.uuid(),
  userId: z.uuid(),
  knowledgeBaseId: z.uuid(),
  documentId: z.uuid(),
  sourceId: z.uuid().nullable(),
  fileName: z.string().trim().min(1).max(KNOWLEDGE_UPLOAD_FILE_NAME_MAX_LENGTH),
  mimeType: z.string().trim().min(1).max(KNOWLEDGE_UPLOAD_MIME_TYPE_MAX_LENGTH),
  sizeBytes: z.number().int().positive().max(KNOWLEDGE_DOCUMENT_MAX_BYTES),
});
