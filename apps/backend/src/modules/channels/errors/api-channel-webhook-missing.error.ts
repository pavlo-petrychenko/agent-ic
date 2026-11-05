import { ErrorReason } from '@agent-ic/contracts';
import { API_CHANNEL_WEBHOOK_MISSING_MESSAGE } from '@/modules/channels/constants/channel-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class ApiChannelWebhookMissingError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.InvalidRequest;

  constructor() {
    super(API_CHANNEL_WEBHOOK_MISSING_MESSAGE);
  }
}
