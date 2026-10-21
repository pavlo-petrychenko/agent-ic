import { ErrorReason } from '@agent-ic/contracts';
import type { z } from 'zod';
import { FIELD_PATH_SEPARATOR } from '@/modules/identity/constants/account-input.constants';
import { ROLE_FIELD_REASON } from '@/modules/identity/constants/role.constants';
import { InvalidRoleInputError } from '@/modules/identity/errors/invalid-role-input.error';
import type { FieldIssue } from '@/platform/errors/typedefs/domain-error.typedefs';

const toFieldIssue = (issue: z.core.$ZodIssue): FieldIssue => ({
  path: issue.path.map(String).join(FIELD_PATH_SEPARATOR),
  reason: ROLE_FIELD_REASON[String(issue.path[0] ?? '')] ?? ErrorReason.InvalidRequest,
});

export const parseRoleInput = <TOutput>(schema: z.ZodType<TOutput>, input: unknown): TOutput => {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new InvalidRoleInputError(result.error.issues.map(toFieldIssue));
  }
  return result.data;
};
