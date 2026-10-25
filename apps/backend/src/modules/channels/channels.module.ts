import { AgentsModule } from '@/modules/agents';
import { CHANNEL_ADAPTERS } from '@/modules/channels/constants/channel-adapter.constants';
import type { ChannelAdapter } from '@/modules/channels/gateways/channel-adapter.gateway';
import { HttpTelegramGateway } from '@/modules/channels/gateways/http-telegram.gateway';
import { SimulatedChannelAdapter } from '@/modules/channels/gateways/simulated-channel-adapter.gateway';
import { TelegramGateway } from '@/modules/channels/gateways/telegram.gateway';
import { DeliverOutboundMessageListener } from '@/modules/channels/listeners/deliver-outbound-message.listener';
import { ChannelEventsRepository } from '@/modules/channels/repositories/channel-events.repository';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ConnectTelegramResolver } from '@/modules/channels/resolvers/connect-telegram.resolver';
import { ChannelAdapterRegistryService } from '@/modules/channels/services/channel-adapter-registry.service';
import { ChannelMetricsService } from '@/modules/channels/services/channel-metrics.service';
import { ChannelConnectionService } from '@/modules/channels/services/channel-connection.service';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import { TelegramChannelService } from '@/modules/channels/services/telegram-channel.service';
import { ConnectTelegramChannelUseCase } from '@/modules/channels/use-cases/connect-telegram.use-case';
import { DeliverOutboundMessageUseCase } from '@/modules/channels/use-cases/deliver-outbound-message.use-case';
import { ConversationsModule } from '@/modules/conversations';
import { CryptoModule } from '@/platform/crypto/crypto.module';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class ChannelsModule extends defineModule({
  imports: [AgentsModule, ConversationsModule, CryptoModule],
  providers: [
    ChannelsRepository,
    ChannelEventsRepository,
    ChannelTokenService,
    ChannelConnectionService,
    TelegramChannelService,
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
    ChannelMetricsService,
    ConnectTelegramChannelUseCase,
    DeliverOutboundMessageUseCase,
  ],
  resolvers: [ConnectTelegramResolver],
  listeners: [DeliverOutboundMessageListener],
  exports: [SimulatedChannelAdapter, ChannelAdapterRegistryService],
}) {}
