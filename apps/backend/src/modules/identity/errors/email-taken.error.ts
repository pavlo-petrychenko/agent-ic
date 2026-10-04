import { ErrorReason } from '@agent-ic/contracts';
import { EMAIL_TAKEN_MESSAGE } from '@/modules/identity/constants/identity-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class EmailTakenError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.EmailTaken;

  constructor() {
    super(EMAIL_TAKEN_MESSAGE);
  }
}
