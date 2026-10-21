import type { SimulatedChannelAdapter } from '@/modules/channels/gateways/simulated-channel-adapter.gateway';
import type { ChannelEventsRepository } from '@/modules/channels/repositories/channel-events.repository';
import type { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import type { TelegramChannelsRepository } from '@/modules/channels/repositories/telegram-channels.repository';
import type { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import type { DeliverOutboundMessageUseCase } from '@/modules/channels/use-cases/deliver-outbound-message.use-case';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

export interface ChannelsTestbed extends ConversationsTestbed {
  readonly deliver: DeliverOutboundMessageUseCase;
  readonly simulated: SimulatedChannelAdapter;
  readonly channels: ChannelsRepository;
  readonly channelEvents: ChannelEventsRepository;
  readonly telegramChannels: TelegramChannelsRepository;
  readonly channelTokens: ChannelTokenService;
}
