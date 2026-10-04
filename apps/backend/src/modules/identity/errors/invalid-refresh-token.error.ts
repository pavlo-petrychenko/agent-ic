import { ErrorReason } from '@agent-ic/contracts';
import { INVALID_REFRESH_TOKEN_MESSAGE } from '@/modules/identity/constants/identity-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class InvalidRefreshTokenError extends DomainError {
  readonly kind = DomainErrorKind.Unauthenticated;
  readonly reason = ErrorReason.InvalidRefreshToken;

  constructor() {
    super(INVALID_REFRESH_TOKEN_MESSAGE);
  }
}
