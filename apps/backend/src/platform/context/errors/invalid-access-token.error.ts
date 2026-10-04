import { ErrorReason } from '@agent-ic/contracts';
import { INVALID_ACCESS_TOKEN_MESSAGE } from '@/platform/context/constants/authentication.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class InvalidAccessTokenError extends DomainError {
  readonly kind = DomainErrorKind.Unauthenticated;
  readonly reason = ErrorReason.InvalidAccessToken;

  constructor(cause?: unknown) {
    super(INVALID_ACCESS_TOKEN_MESSAGE, { cause });
  }
}
