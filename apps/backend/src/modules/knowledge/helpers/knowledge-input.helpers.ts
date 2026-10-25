import { ErrorReason } from '@agent-ic/contracts';
import type { z } from 'zod';
import {
  KNOWLEDGE_FIELD_PATH_SEPARATOR,
  KNOWLEDGE_FIELD_REASON,
} from '@/modules/knowledge/constants/knowledge-input.constants';
import { InvalidKnowledgeInputError } from '@/modules/knowledge/errors/invalid-knowledge-input.error';
import type { FieldIssue } from '@/platform/errors/typedefs/domain-error.typedefs';

const toFieldIssue = (issue: z.core.$ZodIssue): FieldIssue => ({
  path: issue.path.map(String).join(KNOWLEDGE_FIELD_PATH_SEPARATOR),
  reason: KNOWLEDGE_FIELD_REASON[String(issue.path[0] ?? '')] ?? ErrorReason.InvalidRequest,
});

export const parseKnowledgeInput = <TOutput>(
  schema: z.ZodType<TOutput>,
  input: unknown,
): TOutput => {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new InvalidKnowledgeInputError(result.error.issues.map(toFieldIssue));
  }
  return result.data;
};
