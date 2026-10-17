import { ErrorReason } from '@agent-ic/contracts';
import { ROLE_NOT_FOUND_MESSAGE } from '@/modules/identity/constants/workspace-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class RoleNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.RoleNotFound;

  constructor(roleId: string) {
    super(ROLE_NOT_FOUND_MESSAGE, { details: { roleId } });
  }
}
