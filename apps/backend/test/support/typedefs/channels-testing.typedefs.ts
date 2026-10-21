import type { SimulatedChannelAdapter } from '@/modules/channels/gateways/simulated-channel-adapter.gateway';
import type { ChannelUpdatesRepository } from '@/modules/channels/repositories/channel-updates.repository';
import type { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import type { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import type { DeliverOutboundMessageUseCase } from '@/modules/channels/use-cases/deliver-outbound-message.use-case';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

export interface ChannelsTestbed extends ConversationsTestbed {
  readonly deliver: DeliverOutboundMessageUseCase;
  readonly simulated: SimulatedChannelAdapter;
  readonly channels: ChannelsRepository;
  readonly channelUpdates: ChannelUpdatesRepository;
  readonly channelTokens: ChannelTokenService;
}
