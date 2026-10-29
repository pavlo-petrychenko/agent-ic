import { AgentsModule } from '@/modules/agents';
import { CHANNEL_ADAPTERS } from '@/modules/channels/constants/channel-adapter.constants';
import { TelegramWebhookController } from '@/modules/channels/controllers/telegram-webhook.controller';
import type { ChannelAdapter } from '@/modules/channels/gateways/channel-adapter.gateway';
import { HttpTelegramGateway } from '@/modules/channels/gateways/http-telegram.gateway';
import { SimulatedChannelAdapter } from '@/modules/channels/gateways/simulated-channel-adapter.gateway';
import { TelegramChannelAdapter } from '@/modules/channels/gateways/telegram-channel-adapter.gateway';
import { TelegramGateway } from '@/modules/channels/gateways/telegram.gateway';
import { DeliverOutboundMessageListener } from '@/modules/channels/listeners/deliver-outbound-message.listener';
import { ChannelEventsRepository } from '@/modules/channels/repositories/channel-events.repository';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { TelegramPollerRepository } from '@/modules/channels/repositories/telegram-poller.repository';
import { ChannelResolver } from '@/modules/channels/resolvers/channel.resolver';
import { ConnectTelegramResolver } from '@/modules/channels/resolvers/connect-telegram.resolver';
import { DeleteChannelResolver } from '@/modules/channels/resolvers/delete-channel.resolver';
import { DisconnectTelegramResolver } from '@/modules/channels/resolvers/disconnect-telegram.resolver';
import { ReplaceTelegramTokenResolver } from '@/modules/channels/resolvers/replace-telegram-token.resolver';
import { UpdateTelegramResolver } from '@/modules/channels/resolvers/update-telegram.resolver';
import { ChannelAdapterRegistryService } from '@/modules/channels/services/channel-adapter-registry.service';
import { ChannelConnectionService } from '@/modules/channels/services/channel-connection.service';
import { ChannelMetricsService } from '@/modules/channels/services/channel-metrics.service';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import { TelegramChannelService } from '@/modules/channels/services/telegram-channel.service';
import { TelegramPollerService } from '@/modules/channels/services/telegram-poller.service';
import { TelegramUpdatesService } from '@/modules/channels/services/telegram-updates.service';
import { ConnectTelegramChannelUseCase } from '@/modules/channels/use-cases/connect-telegram.use-case';
import { DeleteChannelUseCase } from '@/modules/channels/use-cases/delete-channel.use-case';
import { DeliverOutboundMessageUseCase } from '@/modules/channels/use-cases/deliver-outbound-message.use-case';
import { DisconnectTelegramUseCase } from '@/modules/channels/use-cases/disconnect-telegram.use-case';
import { GetChannelUseCase } from '@/modules/channels/use-cases/get-channel.use-case';
import { HandleTelegramWebhookUseCase } from '@/modules/channels/use-cases/handle-telegram-webhook.use-case';
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
    TelegramPollerRepository,
    ChannelTokenService,
    ChannelConnectionService,
    TelegramChannelService,
    TelegramPollerService,
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
    ReplaceTelegramTokenUseCase,
    UpdateTelegramChannelUseCase,
    DeliverOutboundMessageUseCase,
    HandleTelegramWebhookUseCase,
  ],
  resolvers: [
    ChannelResolver,
    ConnectTelegramResolver,
    DeleteChannelResolver,
    DisconnectTelegramResolver,
    ReplaceTelegramTokenResolver,
    UpdateTelegramResolver,
  ],
  gatewayControllers: [TelegramWebhookController],
  listeners: [DeliverOutboundMessageListener],
  exports: [SimulatedChannelAdapter, TelegramChannelAdapter, ChannelAdapterRegistryService],
}) {}
