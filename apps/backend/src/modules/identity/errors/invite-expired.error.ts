import { ErrorReason } from '@agent-ic/contracts';
import { INVITE_EXPIRED_MESSAGE } from '@/modules/identity/constants/workspace-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class InviteExpiredError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.InviteExpired;

  constructor() {
    super(INVITE_EXPIRED_MESSAGE);
  }
}
