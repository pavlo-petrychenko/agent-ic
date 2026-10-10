import { ErrorReason } from '@agent-ic/contracts';
import { CHANNEL_ADAPTER_NOT_FOUND_MESSAGE } from '@/modules/channels/constants/channel-adapter.constants';
import type { ChannelKind } from '@/modules/conversations';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class ChannelAdapterNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.ChannelAdapterNotFound;

  constructor(channelKind: ChannelKind) {
    super(CHANNEL_ADAPTER_NOT_FOUND_MESSAGE, { details: { channelKind } });
  }
}
