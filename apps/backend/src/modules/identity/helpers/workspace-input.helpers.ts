import { ErrorReason } from '@agent-ic/contracts';
import type { z } from 'zod';
import { FIELD_PATH_SEPARATOR } from '@/modules/identity/constants/account-input.constants';
import { WORKSPACE_FIELD_REASON } from '@/modules/identity/constants/workspace.constants';
import { InvalidWorkspaceInputError } from '@/modules/identity/errors/invalid-workspace-input.error';
import type { FieldIssue } from '@/platform/errors/typedefs/domain-error.typedefs';

export const isSupportedTimeZone = (timeZone: string): boolean => {
  try {
    return Intl.DateTimeFormat(undefined, { timeZone }).resolvedOptions().timeZone !== '';
  } catch (error) {
    if (error instanceof RangeError) {
      return false;
    }
    throw error;
  }
};

const toFieldIssue = (issue: z.core.$ZodIssue): FieldIssue => ({
  path: issue.path.map(String).join(FIELD_PATH_SEPARATOR),
  reason: WORKSPACE_FIELD_REASON[String(issue.path[0] ?? '')] ?? ErrorReason.InvalidRequest,
});

export const parseWorkspaceInput = <TOutput>(
  schema: z.ZodType<TOutput>,
  input: unknown,
): TOutput => {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new InvalidWorkspaceInputError(result.error.issues.map(toFieldIssue));
  }
  return result.data;
};
