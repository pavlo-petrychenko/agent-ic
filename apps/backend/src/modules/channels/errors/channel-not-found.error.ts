import { ErrorReason } from '@agent-ic/contracts';
import { CHANNEL_NOT_FOUND_MESSAGE } from '@/modules/channels/constants/channel-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class ChannelNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.ChannelNotFound;

  constructor() {
    super(CHANNEL_NOT_FOUND_MESSAGE);
  }
}
