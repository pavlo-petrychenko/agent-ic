import type { SimulatedChannelAdapter } from '@/modules/channels/gateways/simulated-channel-adapter.gateway';
import type { DeliverOutboundMessageUseCase } from '@/modules/channels/use-cases/deliver-outbound-message.use-case';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

export interface ChannelsTestbed extends ConversationsTestbed {
  readonly deliver: DeliverOutboundMessageUseCase;
  readonly simulated: SimulatedChannelAdapter;
}
