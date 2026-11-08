import { ErrorReason } from '@agent-ic/contracts';
import { NOTIFICATION_EMAIL_VERIFICATION_INVALID_MESSAGE } from '@/modules/notifications/constants/notification-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class NotificationEmailVerificationInvalidError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.TokenInvalid;

  constructor() {
    super(NOTIFICATION_EMAIL_VERIFICATION_INVALID_MESSAGE);
  }
}
