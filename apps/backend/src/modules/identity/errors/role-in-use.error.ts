import { ErrorReason } from '@agent-ic/contracts';
import { ROLE_IN_USE_MESSAGE } from '@/modules/identity/constants/workspace-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class RoleInUseError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.RoleInUse;

  constructor(roleId: string) {
    super(ROLE_IN_USE_MESSAGE, { details: { roleId } });
  }
}
