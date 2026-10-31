import { ErrorReason } from '@agent-ic/contracts';
import { API_CHANNEL_KEY_INVALID_MESSAGE } from '@/modules/channels/constants/channel-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class InvalidApiChannelKeyError extends DomainError {
  readonly kind = DomainErrorKind.Unauthenticated;
  readonly reason = ErrorReason.InvalidCredentials;

  constructor() {
    super(API_CHANNEL_KEY_INVALID_MESSAGE);
  }
}
