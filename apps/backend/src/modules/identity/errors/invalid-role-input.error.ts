import { ErrorReason } from '@agent-ic/contracts';
import { INVALID_ROLE_NAME_MESSAGE } from '@/modules/identity/constants/workspace-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import type { FieldIssue } from '@/platform/errors/typedefs/domain-error.typedefs';

export class InvalidRoleInputError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.InvalidRequest;

  constructor(fields: readonly FieldIssue[]) {
    super(INVALID_ROLE_NAME_MESSAGE, { fields });
  }
}
