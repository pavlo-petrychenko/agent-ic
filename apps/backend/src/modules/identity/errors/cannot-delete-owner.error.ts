import { ErrorReason } from '@agent-ic/contracts';
import { CANNOT_DELETE_OWNER } from '@/modules/identity/constants/workspace-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class CannotDeleteOwnerError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.CannotDeleteOwner;

  constructor() {
    super(CANNOT_DELETE_OWNER);
  }
}
