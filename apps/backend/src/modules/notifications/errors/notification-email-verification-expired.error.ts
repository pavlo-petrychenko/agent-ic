import { ErrorReason } from '@agent-ic/contracts';
import { NOTIFICATION_EMAIL_VERIFICATION_EXPIRED_MESSAGE } from '@/modules/notifications/constants/notification-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class NotificationEmailVerificationExpiredError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.TokenExpired;

  constructor() {
    super(NOTIFICATION_EMAIL_VERIFICATION_EXPIRED_MESSAGE);
  }
}
