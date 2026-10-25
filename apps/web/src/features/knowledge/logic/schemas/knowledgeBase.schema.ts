import { KNOWLEDGE_BASE_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { z } from 'zod';
import { KnowledgeFormField } from '@/features/knowledge/constants/knowledgeForm.constants';

export const createKnowledgeBaseSchema = (message: string) =>
  z.object({
    [KnowledgeFormField.Name]: z
      .string()
      .trim()
      .min(1, message)
      .max(KNOWLEDGE_BASE_NAME_MAX_LENGTH, message),
  });
