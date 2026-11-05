import { ErrorReason } from '@agent-ic/contracts';
import { GOOGLE_OAUTH_STATE_INVALID_MESSAGE } from '@/modules/knowledge/constants/knowledge-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class GoogleOAuthStateInvalidError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.GoogleOAuthStateInvalid;

  constructor() {
    super(GOOGLE_OAUTH_STATE_INVALID_MESSAGE);
  }
}
