import { ErrorReason } from '@agent-ic/contracts';
import { CHANNEL_RECONNECT_IN_PROGRESS_MESSAGE } from '@/modules/channels/constants/channel-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class ChannelReconnectInProgressError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.InvalidRequest;

  constructor() {
    super(CHANNEL_RECONNECT_IN_PROGRESS_MESSAGE);
  }
}
