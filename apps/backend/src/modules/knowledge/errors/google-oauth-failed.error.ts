import { ErrorReason } from '@agent-ic/contracts';
import { GOOGLE_OAUTH_FAILED_MESSAGE } from '@/modules/knowledge/constants/knowledge-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class GoogleOAuthFailedError extends DomainError {
  readonly kind = DomainErrorKind.Unavailable;
  readonly reason = ErrorReason.GoogleOAuthFailed;

  constructor(details: Readonly<Record<string, unknown>> = {}, cause?: unknown) {
    super(GOOGLE_OAUTH_FAILED_MESSAGE, { details, cause });
  }

  static missingRefreshToken(): GoogleOAuthFailedError {
    return new GoogleOAuthFailedError({ code: 'refresh_token_missing' });
  }
}
