import { ErrorReason } from '@agent-ic/contracts';
import { INVALID_CREDENTIALS_MESSAGE } from '@/modules/identity/constants/identity-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class InvalidCredentialsError extends DomainError {
  readonly kind = DomainErrorKind.Unauthenticated;
  readonly reason = ErrorReason.InvalidCredentials;

  constructor() {
    super(INVALID_CREDENTIALS_MESSAGE);
  }
}
