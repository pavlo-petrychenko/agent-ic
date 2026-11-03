import {
  KNOWLEDGE_BASE_DESCRIPTION_MAX_LENGTH,
  KNOWLEDGE_BASE_NAME_MAX_LENGTH,
  KNOWLEDGE_DOCUMENT_MAX_BYTES,
  KNOWLEDGE_SOURCE_TITLE_MAX_LENGTH,
  KNOWLEDGE_SUMMARY_MAX_LENGTH,
} from '@agent-ic/contracts';
import { z } from 'zod';
import { KnowledgeField } from '@/modules/knowledge/constants/knowledge-input.constants';
import {
  KNOWLEDGE_SEARCH_DEFAULT_TOP_K,
  KNOWLEDGE_SEARCH_MAX_TOP_K,
  KNOWLEDGE_SEARCH_MIN_TOP_K,
  KNOWLEDGE_SEARCH_QUERY_MAX_LENGTH,
} from '@/modules/knowledge/constants/knowledge-search.constants';
import {
  KNOWLEDGE_UPLOAD_FILE_NAME_MAX_LENGTH,
  KNOWLEDGE_UPLOAD_MIME_TYPE_MAX_LENGTH,
} from '@/modules/knowledge/constants/knowledge-upload.constants';
import {
  knowledgeScheduleInputShape,
  requireScheduleFields,
} from '@/modules/knowledge/schemas/knowledge-schedule.schema';

const nameSchema = z.string().trim().min(1).max(KNOWLEDGE_BASE_NAME_MAX_LENGTH);
const recordIdSchema = z.string().min(1);
const sourceIdInputSchema = z.object({ [KnowledgeField.Id]: recordIdSchema });
const sourceTitleSchema = z.string().trim().min(1).max(KNOWLEDGE_SOURCE_TITLE_MAX_LENGTH);
const documentSummarySchema = z.string().trim().min(1).max(KNOWLEDGE_SUMMARY_MAX_LENGTH);

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

export const renameKnowledgeBaseInputSchema = z.object({
  [KnowledgeField.Id]: recordIdSchema,
  [KnowledgeField.Name]: nameSchema,
});

export const renameKnowledgeSourceInputSchema = z.object({
  [KnowledgeField.Id]: recordIdSchema,
  [KnowledgeField.Title]: sourceTitleSchema,
});

export const updateDocumentSummaryInputSchema = z.object({
  [KnowledgeField.Id]: recordIdSchema,
  [KnowledgeField.Summary]: documentSummarySchema,
});

export const deleteKnowledgeBaseInputSchema = z.object({
  [KnowledgeField.Id]: recordIdSchema,
});

export const getKnowledgeSourceInputSchema = sourceIdInputSchema;

export const deleteKnowledgeSourceInputSchema = sourceIdInputSchema;

export const retryKnowledgeSourceInputSchema = sourceIdInputSchema;

export const syncKnowledgeSourceInputSchema = sourceIdInputSchema;

export const removeSourceDocumentInputSchema = z.object({
  [KnowledgeField.SourceId]: recordIdSchema,
  [KnowledgeField.DocumentId]: recordIdSchema,
});

export const updateKnowledgeSourceScheduleInputSchema = z
  .object({
    [KnowledgeField.Id]: recordIdSchema,
    ...knowledgeScheduleInputShape,
  })
  .superRefine(requireScheduleFields);

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

export const listKnowledgeBaseUsagesInputSchema = z.object({
  [KnowledgeField.KnowledgeBaseId]: recordIdSchema,
});

export const searchKnowledgeInputSchema = z.object({
  [KnowledgeField.KnowledgeBaseId]: recordIdSchema,
  [KnowledgeField.Query]: z
    .string()
    .trim()
    .min(1)
    .transform((value) => value.slice(0, KNOWLEDGE_SEARCH_QUERY_MAX_LENGTH)),
  [KnowledgeField.TopK]: z
    .number()
    .int()
    .min(KNOWLEDGE_SEARCH_MIN_TOP_K)
    .max(KNOWLEDGE_SEARCH_MAX_TOP_K)
    .nullish()
    .transform((value) => value ?? KNOWLEDGE_SEARCH_DEFAULT_TOP_K),
});
