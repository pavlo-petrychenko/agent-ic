import { ErrorReason } from '@agent-ic/contracts';
import { EMAIL_ALREADY_CONFIRMED_MESSAGE } from '@/modules/identity/constants/identity-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class EmailAlreadyConfirmedError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.EmailAlreadyConfirmed;

  constructor() {
    super(EMAIL_ALREADY_CONFIRMED_MESSAGE);
  }
}
