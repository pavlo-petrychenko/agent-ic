import { ErrorReason } from '@agent-ic/contracts';
import { INVALID_NOTIFICATION_EMAIL_MESSAGE } from '@/modules/notifications/constants/notification-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class InvalidNotificationEmailError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.InvalidEmail;

  constructor() {
    super(INVALID_NOTIFICATION_EMAIL_MESSAGE);
  }
}
