import { ErrorReason } from '@agent-ic/contracts';
import { INVITE_INVALID_MESSAGE } from '@/modules/identity/constants/workspace-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class InviteInvalidError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.InviteInvalid;

  constructor() {
    super(INVITE_INVALID_MESSAGE);
  }
}
