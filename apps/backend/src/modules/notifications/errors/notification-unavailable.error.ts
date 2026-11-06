import { ErrorReason } from '@agent-ic/contracts';
import { NOTIFICATION_UNAVAILABLE_MESSAGE } from '@/modules/notifications/constants/notification-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class NotificationUnavailableError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.Internal;

  constructor() {
    super(NOTIFICATION_UNAVAILABLE_MESSAGE);
  }
}
