import { ErrorReason } from '@agent-ic/contracts';
import { CHANNEL_ALREADY_CONNECTED_MESSAGE } from '@/modules/channels/constants/channel-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class ChannelAlreadyConnectedError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.ChannelAlreadyConnected;

  constructor() {
    super(CHANNEL_ALREADY_CONNECTED_MESSAGE);
  }
}
