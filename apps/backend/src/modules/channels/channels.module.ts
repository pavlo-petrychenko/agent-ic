import { AgentsModule } from '@/modules/agents';
import { CHANNEL_ADAPTERS } from '@/modules/channels/constants/channel-adapter.constants';
import type { ChannelAdapter } from '@/modules/channels/gateways/channel-adapter.gateway';
import { HttpTelegramGateway } from '@/modules/channels/gateways/http-telegram.gateway';
import { SimulatedChannelAdapter } from '@/modules/channels/gateways/simulated-channel-adapter.gateway';
import { TelegramGateway } from '@/modules/channels/gateways/telegram.gateway';
import { DeliverOutboundMessageListener } from '@/modules/channels/listeners/deliver-outbound-message.listener';
import { ChannelEventsRepository } from '@/modules/channels/repositories/channel-events.repository';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ChannelResolver } from '@/modules/channels/resolvers/channel.resolver';
import { ConnectTelegramResolver } from '@/modules/channels/resolvers/connect-telegram.resolver';
import { DisconnectTelegramResolver } from '@/modules/channels/resolvers/disconnect-telegram.resolver';
import { ReplaceTelegramTokenResolver } from '@/modules/channels/resolvers/replace-telegram-token.resolver';
import { UpdateTelegramResolver } from '@/modules/channels/resolvers/update-telegram.resolver';
import { ChannelAdapterRegistryService } from '@/modules/channels/services/channel-adapter-registry.service';
import { ChannelConnectionService } from '@/modules/channels/services/channel-connection.service';
import { ChannelMetricsService } from '@/modules/channels/services/channel-metrics.service';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import { TelegramChannelService } from '@/modules/channels/services/telegram-channel.service';
import { ConnectTelegramChannelUseCase } from '@/modules/channels/use-cases/connect-telegram.use-case';
import { DeliverOutboundMessageUseCase } from '@/modules/channels/use-cases/deliver-outbound-message.use-case';
import { DisconnectTelegramUseCase } from '@/modules/channels/use-cases/disconnect-telegram.use-case';
import { GetChannelUseCase } from '@/modules/channels/use-cases/get-channel.use-case';
import { ListChannelsUseCase } from '@/modules/channels/use-cases/list-channels.use-case';
import { ReplaceTelegramTokenUseCase } from '@/modules/channels/use-cases/replace-telegram-token.use-case';
import { UpdateTelegramChannelUseCase } from '@/modules/channels/use-cases/update-telegram.use-case';
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
    DisconnectTelegramUseCase,
    GetChannelUseCase,
    ListChannelsUseCase,
    ReplaceTelegramTokenUseCase,
    UpdateTelegramChannelUseCase,
    DeliverOutboundMessageUseCase,
  ],
  resolvers: [
    ChannelResolver,
    ConnectTelegramResolver,
    DisconnectTelegramResolver,
    ReplaceTelegramTokenResolver,
    UpdateTelegramResolver,
  ],
  listeners: [DeliverOutboundMessageListener],
  exports: [SimulatedChannelAdapter, ChannelAdapterRegistryService],
}) {}
