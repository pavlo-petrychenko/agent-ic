import { ErrorReason } from '@agent-ic/contracts';
import type { z } from 'zod';
import { PROMPT_FOLDER_FIELD_REASON } from '@/modules/prompts/constants/prompt-folder-input.constants';
import { PROMPT_FIELD_PATH_SEPARATOR } from '@/modules/prompts/constants/prompt-input.constants';
import { InvalidPromptInputError } from '@/modules/prompts/errors/invalid-prompt-input.error';
import type { FieldIssue } from '@/platform/errors/typedefs/domain-error.typedefs';

const toFieldIssue = (issue: z.core.$ZodIssue): FieldIssue => ({
  path: issue.path.map(String).join(PROMPT_FIELD_PATH_SEPARATOR),
  reason: PROMPT_FOLDER_FIELD_REASON[String(issue.path[0] ?? '')] ?? ErrorReason.InvalidRequest,
});

export const parsePromptFolderInput = <TOutput>(
  schema: z.ZodType<TOutput>,
  input: unknown,
): TOutput => {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new InvalidPromptInputError(result.error.issues.map(toFieldIssue));
  }
  return result.data;
};
