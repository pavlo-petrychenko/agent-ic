import { KNOWLEDGE_SOURCE_TITLE_MAX_LENGTH } from '@agent-ic/contracts';
import { z } from 'zod';
import { KnowledgeFormField } from '@/features/knowledge/constants/knowledgeForm.constants';

export const renameKnowledgeSourceSchema = (message: string) =>
  z.object({
    [KnowledgeFormField.Title]: z
      .string()
      .trim()
      .min(1, message)
      .max(KNOWLEDGE_SOURCE_TITLE_MAX_LENGTH, message),
  });
