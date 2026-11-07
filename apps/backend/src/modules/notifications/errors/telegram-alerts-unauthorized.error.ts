import { ErrorReason } from '@agent-ic/contracts';
import { TELEGRAM_ALERTS_UNAUTHORIZED_MESSAGE } from '@/modules/notifications/constants/telegram-alert.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class TelegramAlertsUnauthorizedError extends DomainError {
  readonly kind = DomainErrorKind.Unauthenticated;
  readonly reason = ErrorReason.AuthenticationRequired;

  constructor() {
    super(TELEGRAM_ALERTS_UNAUTHORIZED_MESSAGE);
  }
}
