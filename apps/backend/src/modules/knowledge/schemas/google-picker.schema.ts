import { KNOWLEDGE_DOCUMENT_TITLE_MAX_LENGTH } from '@agent-ic/contracts';
import { z } from 'zod';
import { GOOGLE_PICKER_MAX_DOCUMENTS } from '@/modules/knowledge/constants/google-drive.constants';
import { KnowledgeField } from '@/modules/knowledge/constants/knowledge-input.constants';

const recordIdSchema = z.string().min(1);
const nullableTextSchema = z
  .string()
  .trim()
  .max(2048)
  .nullish()
  .transform((value) =>
    value === null || value === undefined || value.length === 0 ? null : value,
  );

const pickedDocumentSchema = z.object({
  [KnowledgeField.Id]: z.string().trim().min(1).max(256),
  [KnowledgeField.Name]: z.string().trim().min(1).max(KNOWLEDGE_DOCUMENT_TITLE_MAX_LENGTH),
  [KnowledgeField.MimeType]: z.string().trim().min(1).max(255),
  [KnowledgeField.Url]: nullableTextSchema,
  [KnowledgeField.ResourceKey]: nullableTextSchema,
});

export const createGooglePickerSessionInputSchema = z.object({
  [KnowledgeField.ConnectionId]: recordIdSchema,
});

export const createGoogleDocsSourceInputSchema = z.object({
  [KnowledgeField.KnowledgeBaseId]: recordIdSchema,
  [KnowledgeField.ConnectionId]: recordIdSchema,
  [KnowledgeField.Documents]: z
    .array(pickedDocumentSchema)
    .min(1)
    .max(GOOGLE_PICKER_MAX_DOCUMENTS)
    .refine(
      (documents) => new Set(documents.map((document) => document.id)).size === documents.length,
      { message: 'the selected documents contain duplicates' },
    ),
});
