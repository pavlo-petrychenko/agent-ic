import {
  KNOWLEDGE_BASE_DESCRIPTION_MAX_LENGTH,
  KNOWLEDGE_BASE_NAME_MAX_LENGTH,
} from '@agent-ic/contracts';
import { z } from 'zod';
import { KnowledgeField } from '@/modules/knowledge/constants/knowledge-input.constants';

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
