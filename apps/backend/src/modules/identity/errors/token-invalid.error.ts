import { ErrorReason } from '@agent-ic/contracts';
import { TOKEN_INVALID_MESSAGE } from '@/modules/identity/constants/identity-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class TokenInvalidError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.TokenInvalid;

  constructor() {
    super(TOKEN_INVALID_MESSAGE);
  }
}
