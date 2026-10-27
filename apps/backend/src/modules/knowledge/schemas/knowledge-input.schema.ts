import {
  KNOWLEDGE_BASE_DESCRIPTION_MAX_LENGTH,
  KNOWLEDGE_BASE_NAME_MAX_LENGTH,
  KNOWLEDGE_DOCUMENT_MAX_BYTES,
} from '@agent-ic/contracts';
import { z } from 'zod';
import { KnowledgeField } from '@/modules/knowledge/constants/knowledge-input.constants';
import {
  KNOWLEDGE_UPLOAD_FILE_NAME_MAX_LENGTH,
  KNOWLEDGE_UPLOAD_MIME_TYPE_MAX_LENGTH,
} from '@/modules/knowledge/constants/knowledge-upload.constants';

const nameSchema = z.string().trim().min(1).max(KNOWLEDGE_BASE_NAME_MAX_LENGTH);
const recordIdSchema = z.string().min(1);

const descriptionSchema = z
  .string()
  .trim()
  .max(KNOWLEDGE_BASE_DESCRIPTION_MAX_LENGTH)
  .nullish()
  .transform((value) =>
    value === null || value === undefined || value.length === 0 ? null : value,
  );

export const createKnowledgeBaseInputSchema = z.object({
  [KnowledgeField.Name]: nameSchema,
  [KnowledgeField.Description]: descriptionSchema,
});

export const deleteKnowledgeBaseInputSchema = z.object({
  [KnowledgeField.Id]: recordIdSchema,
});

export const deleteKnowledgeSourceInputSchema = z.object({
  [KnowledgeField.Id]: recordIdSchema,
});

export const createUploadInputSchema = z.object({
  [KnowledgeField.KnowledgeBaseId]: recordIdSchema,
  [KnowledgeField.FileName]: z.string().trim().min(1).max(KNOWLEDGE_UPLOAD_FILE_NAME_MAX_LENGTH),
  [KnowledgeField.MimeType]: z.string().trim().min(1).max(KNOWLEDGE_UPLOAD_MIME_TYPE_MAX_LENGTH),
  [KnowledgeField.SizeBytes]: z.number().int().positive().max(KNOWLEDGE_DOCUMENT_MAX_BYTES),
  [KnowledgeField.SourceId]: recordIdSchema.nullish(),
});

export const confirmUploadInputSchema = z.object({
  [KnowledgeField.DocumentId]: recordIdSchema,
});

export const listKnowledgeSourcesInputSchema = z.object({
  [KnowledgeField.KnowledgeBaseId]: recordIdSchema,
});
