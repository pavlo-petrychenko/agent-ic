import {
  AGENT_RESERVED_TOOL_NAMES,
  KNOWLEDGE_TOOL_DESCRIPTION_MAX_LENGTH,
  KNOWLEDGE_TOOL_NAME_MAX_LENGTH,
  KNOWLEDGE_TOOL_NAME_PATTERN,
} from '@agent-ic/contracts';
import { z } from 'zod';
import { KnowledgeFormField } from '@/features/knowledge/constants/knowledgeForm.constants';

interface KnowledgeToolSchemaMessages {
  readonly nameInvalid: string;
  readonly nameReserved: string;
  readonly descriptionInvalid: string;
}

export const knowledgeToolSchema = ({
  nameInvalid,
  nameReserved,
  descriptionInvalid,
}: KnowledgeToolSchemaMessages) =>
  z.object({
    [KnowledgeFormField.ToolName]: z
      .string()
      .trim()
      .min(1, nameInvalid)
      .max(KNOWLEDGE_TOOL_NAME_MAX_LENGTH, nameInvalid)
      .regex(KNOWLEDGE_TOOL_NAME_PATTERN, nameInvalid)
      .refine(
        (value) => !AGENT_RESERVED_TOOL_NAMES.some((reserved) => reserved === value),
        nameReserved,
      ),
    [KnowledgeFormField.ToolDescription]: z
      .string()
      .trim()
      .max(KNOWLEDGE_TOOL_DESCRIPTION_MAX_LENGTH, descriptionInvalid),
  });
