import { ErrorReason } from '@agent-ic/contracts';
import { ROLE_BASE_INVALID_MESSAGE } from '@/modules/identity/constants/workspace-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class RoleBaseInvalidError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.RoleBaseInvalid;

  constructor(baseRole: string) {
    super(ROLE_BASE_INVALID_MESSAGE, { details: { baseRole } });
  }
}
