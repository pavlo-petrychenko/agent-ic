import { ErrorReason } from '@agent-ic/contracts';
import type { z } from 'zod';
import {
  ACCOUNT_FIELD_REASON,
  AccountField,
  FIELD_PATH_SEPARATOR,
  TOO_BIG_ISSUE_CODE,
} from '@/modules/identity/constants/account-input.constants';
import { InvalidAccountInputError } from '@/modules/identity/errors/invalid-account-input.error';
import type { FieldIssue } from '@/platform/errors/typedefs/domain-error.typedefs';

const reasonFor = (issue: z.core.$ZodIssue): ErrorReason => {
  const field = String(issue.path[0] ?? '');
  if (field === AccountField.Password && issue.code === TOO_BIG_ISSUE_CODE) {
    return ErrorReason.PasswordTooLong;
  }
  return ACCOUNT_FIELD_REASON[field] ?? ErrorReason.InvalidRequest;
};

const toFieldIssue = (issue: z.core.$ZodIssue): FieldIssue => ({
  path: issue.path.map(String).join(FIELD_PATH_SEPARATOR),
  reason: reasonFor(issue),
});

export const parseAccountInput = <TOutput>(schema: z.ZodType<TOutput>, input: unknown): TOutput => {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new InvalidAccountInputError(result.error.issues.map(toFieldIssue));
  }
  return result.data;
};
