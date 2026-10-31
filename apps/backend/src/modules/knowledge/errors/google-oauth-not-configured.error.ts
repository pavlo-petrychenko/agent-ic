import { ErrorReason } from '@agent-ic/contracts';
import { GOOGLE_OAUTH_NOT_CONFIGURED_MESSAGE } from '@/modules/knowledge/constants/knowledge-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class GoogleOAuthNotConfiguredError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.GoogleOAuthNotConfigured;

  constructor() {
    super(GOOGLE_OAUTH_NOT_CONFIGURED_MESSAGE);
  }
}
