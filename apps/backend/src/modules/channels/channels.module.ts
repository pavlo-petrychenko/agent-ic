import { AgentsModule } from '@/modules/agents';
import { CHANNEL_ADAPTERS } from '@/modules/channels/constants/channel-adapter.constants';
import { TelegramWebhookController } from '@/modules/channels/controllers/telegram-webhook.controller';
import type { ChannelAdapter } from '@/modules/channels/gateways/channel-adapter.gateway';
import { HttpTelegramGateway } from '@/modules/channels/gateways/http-telegram.gateway';
import { SimulatedChannelAdapter } from '@/modules/channels/gateways/simulated-channel-adapter.gateway';
import { TelegramChannelAdapter } from '@/modules/channels/gateways/telegram-channel-adapter.gateway';
import { TelegramGateway } from '@/modules/channels/gateways/telegram.gateway';
import { DeliverOutboundMessageListener } from '@/modules/channels/listeners/deliver-outbound-message.listener';
import { CheckTelegramTokenHealthProcessor } from '@/modules/channels/processors/check-telegram-token-health.processor';
import { ChannelEventsRepository } from '@/modules/channels/repositories/channel-events.repository';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { TelegramPollerRepository } from '@/modules/channels/repositories/telegram-poller.repository';
import { ChannelResolver } from '@/modules/channels/resolvers/channel.resolver';
import { ConnectTelegramResolver } from '@/modules/channels/resolvers/connect-telegram.resolver';
import { CreateApiChannelResolver } from '@/modules/channels/resolvers/create-api-channel.resolver';
import { DeleteChannelResolver } from '@/modules/channels/resolvers/delete-channel.resolver';
import { DisconnectTelegramResolver } from '@/modules/channels/resolvers/disconnect-telegram.resolver';
import { ReconnectTelegramResolver } from '@/modules/channels/resolvers/reconnect-telegram.resolver';
import { RefreshTelegramIdentityResolver } from '@/modules/channels/resolvers/refresh-telegram-identity.resolver';
import { ReplaceTelegramTokenResolver } from '@/modules/channels/resolvers/replace-telegram-token.resolver';
import { RotateApiChannelKeyResolver } from '@/modules/channels/resolvers/rotate-api-channel-key.resolver';
import { UpdateChannelResolver } from '@/modules/channels/resolvers/update-channel.resolver';
import { ChannelAdapterRegistryService } from '@/modules/channels/services/channel-adapter-registry.service';
import { ChannelConnectionService } from '@/modules/channels/services/channel-connection.service';
import { ChannelHealthService } from '@/modules/channels/services/channel-health.service';
import { ChannelMetricsService } from '@/modules/channels/services/channel-metrics.service';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import { TelegramChannelService } from '@/modules/channels/services/telegram-channel.service';
import { TelegramPollerService } from '@/modules/channels/services/telegram-poller.service';
import { TelegramTokenHealthService } from '@/modules/channels/services/telegram-token-health.service';
import { TelegramUpdatesService } from '@/modules/channels/services/telegram-updates.service';
import { CheckTelegramTokenHealthUseCase } from '@/modules/channels/use-cases/check-telegram-token-health.use-case';
import { ConnectTelegramChannelUseCase } from '@/modules/channels/use-cases/connect-telegram.use-case';
import { CreateApiChannelUseCase } from '@/modules/channels/use-cases/create-api-channel.use-case';
import { DeleteChannelUseCase } from '@/modules/channels/use-cases/delete-channel.use-case';
import { DeliverOutboundMessageUseCase } from '@/modules/channels/use-cases/deliver-outbound-message.use-case';
import { DisconnectTelegramUseCase } from '@/modules/channels/use-cases/disconnect-telegram.use-case';
import { GetChannelUseCase } from '@/modules/channels/use-cases/get-channel.use-case';
import { HandleTelegramWebhookUseCase } from '@/modules/channels/use-cases/handle-telegram-webhook.use-case';
import { ListChannelsUseCase } from '@/modules/channels/use-cases/list-channels.use-case';
import { ReconnectTelegramUseCase } from '@/modules/channels/use-cases/reconnect-telegram.use-case';
import { RefreshTelegramIdentityUseCase } from '@/modules/channels/use-cases/refresh-telegram-identity.use-case';
import { ReplaceTelegramTokenUseCase } from '@/modules/channels/use-cases/replace-telegram-token.use-case';
import { RotateApiChannelKeyUseCase } from '@/modules/channels/use-cases/rotate-api-channel-key.use-case';
import { UpdateChannelUseCase } from '@/modules/channels/use-cases/update-channel.use-case';
import { ConversationsModule } from '@/modules/conversations';
import { CryptoModule } from '@/platform/crypto/crypto.module';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class ChannelsModule extends defineModule({
  imports: [AgentsModule, ConversationsModule, CryptoModule],
  providers: [
    ChannelsRepository,
    ChannelEventsRepository,
    TelegramPollerRepository,
    ChannelTokenService,
    ChannelConnectionService,
    ChannelHealthService,
    TelegramChannelService,
    TelegramPollerService,
    TelegramTokenHealthService,
    TelegramUpdatesService,
    {
      provide: TelegramGateway,
      useClass: HttpTelegramGateway,
    },
    SimulatedChannelAdapter,
    TelegramChannelAdapter,
    {
      provide: CHANNEL_ADAPTERS,
      inject: [SimulatedChannelAdapter, TelegramChannelAdapter],
      useFactory: (
        simulated: SimulatedChannelAdapter,
        telegram: TelegramChannelAdapter,
      ): ChannelAdapter[] => [simulated, telegram],
    },
    ChannelAdapterRegistryService,
    ChannelMetricsService,
    ConnectTelegramChannelUseCase,
    DeleteChannelUseCase,
    DisconnectTelegramUseCase,
    GetChannelUseCase,
    ListChannelsUseCase,
    ReconnectTelegramUseCase,
    RefreshTelegramIdentityUseCase,
    ReplaceTelegramTokenUseCase,
    DeliverOutboundMessageUseCase,
    HandleTelegramWebhookUseCase,
    CheckTelegramTokenHealthUseCase,
    CreateApiChannelUseCase,
    RotateApiChannelKeyUseCase,
    UpdateChannelUseCase,
  ],
  resolvers: [
    ChannelResolver,
    ConnectTelegramResolver,
    CreateApiChannelResolver,
    DeleteChannelResolver,
    DisconnectTelegramResolver,
    ReconnectTelegramResolver,
    RefreshTelegramIdentityResolver,
    ReplaceTelegramTokenResolver,
    RotateApiChannelKeyResolver,
    UpdateChannelResolver,
  ],
  gatewayControllers: [TelegramWebhookController],
  listeners: [DeliverOutboundMessageListener],
  processors: [CheckTelegramTokenHealthProcessor],
  exports: [SimulatedChannelAdapter, TelegramChannelAdapter, ChannelAdapterRegistryService],
}) {}
