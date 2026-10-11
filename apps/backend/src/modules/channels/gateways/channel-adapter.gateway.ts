import type { ChannelOutboundMessage } from '@/modules/channels/typedefs/channel-message.typedefs';
import type { ChannelKind } from '@/modules/conversations';

export abstract class ChannelAdapter {
  abstract readonly kind: ChannelKind;

  abstract send(message: ChannelOutboundMessage): Promise<void>;
}
