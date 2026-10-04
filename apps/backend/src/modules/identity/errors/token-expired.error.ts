import { ErrorReason } from '@agent-ic/contracts';
import { TOKEN_EXPIRED_MESSAGE } from '@/modules/identity/constants/identity-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class TokenExpiredError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.TokenExpired;

  constructor() {
    super(TOKEN_EXPIRED_MESSAGE);
  }
}
