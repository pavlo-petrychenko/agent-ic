import { ErrorReason } from '@agent-ic/contracts';
import { TELEGRAM_TOKEN_INVALID_MESSAGE } from '@/modules/channels/constants/channel-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class TelegramTokenInvalidError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.TelegramTokenInvalid;

  constructor() {
    super(TELEGRAM_TOKEN_INVALID_MESSAGE);
  }
}
