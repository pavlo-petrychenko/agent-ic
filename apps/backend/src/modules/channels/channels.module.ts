import { CHANNEL_ADAPTERS } from '@/modules/channels/constants/channel-adapter.constants';
import type { ChannelAdapter } from '@/modules/channels/gateways/channel-adapter.gateway';
import { SimulatedChannelAdapter } from '@/modules/channels/gateways/simulated-channel-adapter.gateway';
import { DeliverOutboundMessageListener } from '@/modules/channels/listeners/deliver-outbound-message.listener';
import { ChannelAdapterRegistryService } from '@/modules/channels/services/channel-adapter-registry.service';
import { DeliverOutboundMessageUseCase } from '@/modules/channels/use-cases/deliver-outbound-message.use-case';
import { ConversationsModule } from '@/modules/conversations';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class ChannelsModule extends defineModule({
  imports: [ConversationsModule],
  providers: [
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
