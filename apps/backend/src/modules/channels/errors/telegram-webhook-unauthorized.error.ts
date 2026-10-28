import { ErrorReason } from '@agent-ic/contracts';
import { TELEGRAM_WEBHOOK_UNAUTHORIZED_MESSAGE } from '@/modules/channels/constants/channel-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class TelegramWebhookUnauthorizedError extends DomainError {
  readonly kind = DomainErrorKind.Unauthenticated;
  readonly reason = ErrorReason.AuthenticationRequired;

  constructor() {
    super(TELEGRAM_WEBHOOK_UNAUTHORIZED_MESSAGE);
  }
}
