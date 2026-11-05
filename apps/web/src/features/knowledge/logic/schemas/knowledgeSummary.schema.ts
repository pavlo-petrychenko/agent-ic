import { KNOWLEDGE_SUMMARY_MAX_LENGTH } from '@agent-ic/contracts';
import { z } from 'zod';
import { KnowledgeFormField } from '@/features/knowledge/constants/knowledgeForm.constants';

export const updateDocumentSummarySchema = (message: string) =>
  z.object({
    [KnowledgeFormField.Summary]: z
      .string()
      .trim()
      .min(1, message)
      .max(KNOWLEDGE_SUMMARY_MAX_LENGTH, message),
  });
