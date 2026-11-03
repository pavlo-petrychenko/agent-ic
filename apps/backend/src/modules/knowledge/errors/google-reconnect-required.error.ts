import { ErrorReason } from '@agent-ic/contracts';
import { GOOGLE_RECONNECT_REQUIRED_MESSAGE } from '@/modules/knowledge/constants/knowledge-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class GoogleReconnectRequiredError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.GoogleReconnectRequired;

  constructor() {
    super(GOOGLE_RECONNECT_REQUIRED_MESSAGE);
  }
}
