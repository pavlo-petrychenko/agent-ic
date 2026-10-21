import { ErrorReason } from '@agent-ic/contracts';
import { CANNOT_CHANGE_ADMIN_ROLE } from '@/modules/identity/constants/workspace-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class CannotChangeAdminRoleError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.CannotChangeAdminRole;

  constructor() {
    super(CANNOT_CHANGE_ADMIN_ROLE);
  }
}
