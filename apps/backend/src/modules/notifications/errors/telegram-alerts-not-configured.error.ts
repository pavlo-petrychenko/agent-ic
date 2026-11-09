import { ErrorReason } from '@agent-ic/contracts';
import { TELEGRAM_ALERTS_NOT_CONFIGURED_MESSAGE } from '@/modules/notifications/constants/notification-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class TelegramAlertsNotConfiguredError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.Internal;

  constructor() {
    super(TELEGRAM_ALERTS_NOT_CONFIGURED_MESSAGE);
  }
}
