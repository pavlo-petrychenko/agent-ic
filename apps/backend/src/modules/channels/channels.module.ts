import { CHANNEL_ADAPTERS } from '@/modules/channels/constants/channel-adapter.constants';
import type { ChannelAdapter } from '@/modules/channels/gateways/channel-adapter.gateway';
import { HttpTelegramGateway } from '@/modules/channels/gateways/http-telegram.gateway';
import { SimulatedChannelAdapter } from '@/modules/channels/gateways/simulated-channel-adapter.gateway';
import { TelegramGateway } from '@/modules/channels/gateways/telegram.gateway';
import { DeliverOutboundMessageListener } from '@/modules/channels/listeners/deliver-outbound-message.listener';
import { ChannelEventsRepository } from '@/modules/channels/repositories/channel-events.repository';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ChannelAdapterRegistryService } from '@/modules/channels/services/channel-adapter-registry.service';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import { DeliverOutboundMessageUseCase } from '@/modules/channels/use-cases/deliver-outbound-message.use-case';
import { ConversationsModule } from '@/modules/conversations';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class ChannelsModule extends defineModule({
  imports: [ConversationsModule],
  providers: [
    ChannelsRepository,
    ChannelEventsRepository,
    ChannelTokenService,
    {
      provide: TelegramGateway,
      useClass: HttpTelegramGateway,
    },
    SimulatedChannelAdapter,
    {
      provide: CHANNEL_ADAPTERS,
      inject: [SimulatedChannelAdapter],
      useFactory: (simulated: SimulatedChannelAdapter): ChannelAdapter[] => [simulated],
    },
    ChannelAdapterRegistryService,
    DeliverOutboundMessageUseCase,
  ],
  listeners: [DeliverOutboundMessageListener],
  exports: [SimulatedChannelAdapter, ChannelAdapterRegistryService],
}) {}
