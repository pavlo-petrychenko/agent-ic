import { ErrorReason } from '@agent-ic/contracts';
import { TELEGRAM_LINK_CODE_UNAVAILABLE_MESSAGE } from '@/modules/notifications/constants/notification-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class TelegramLinkCodeUnavailableError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.Internal;

  constructor() {
    super(TELEGRAM_LINK_CODE_UNAVAILABLE_MESSAGE);
  }
}
