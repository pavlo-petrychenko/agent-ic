import { ErrorReason } from '@agent-ic/contracts';
import { AUTHENTICATION_REQUIRED_MESSAGE } from '@/platform/context/constants/authentication.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class AuthenticationRequiredError extends DomainError {
  readonly kind = DomainErrorKind.Unauthenticated;
  readonly reason = ErrorReason.AuthenticationRequired;

  constructor() {
    super(AUTHENTICATION_REQUIRED_MESSAGE);
  }
}
