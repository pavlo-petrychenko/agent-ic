import { ErrorReason } from '@agent-ic/contracts';
import { EMAIL_NOT_CONFIRMED_MESSAGE } from '@/modules/identity/constants/identity-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class EmailNotConfirmedError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.EmailNotConfirmed;

  constructor() {
    super(EMAIL_NOT_CONFIRMED_MESSAGE);
  }
}
