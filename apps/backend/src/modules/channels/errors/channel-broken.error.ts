import { ErrorReason } from '@agent-ic/contracts';
import { CHANNEL_BROKEN_MESSAGE } from '@/modules/channels/constants/channel-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class ChannelBrokenError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.ChannelBroken;

  constructor(readonly channelId: string) {
    super(CHANNEL_BROKEN_MESSAGE, { details: { channelId } });
  }
}
