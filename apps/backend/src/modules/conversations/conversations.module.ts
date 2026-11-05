import { AgentsModule } from '@/modules/agents';
import { TelegramAlertTakeOverListener } from '@/modules/conversations/listeners/telegram-alert-take-over.listener';
import { CloseInactiveConversationsProcessor } from '@/modules/conversations/processors/close-inactive-conversations.processor';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import { ScheduleContactsRepository } from '@/modules/conversations/repositories/schedule-contacts.repository';
import { CloseConversationResolver } from '@/modules/conversations/resolvers/close-conversation.resolver';
import { ConversationActivityResolver } from '@/modules/conversations/resolvers/conversation-activity.resolver';
import { HandBackResolver } from '@/modules/conversations/resolvers/hand-back.resolver';
import { InboxActivityResolver } from '@/modules/conversations/resolvers/inbox-activity.resolver';
import { InboxConversationResolver } from '@/modules/conversations/resolvers/inbox-conversation.resolver';
import { InboxConversationsResolver } from '@/modules/conversations/resolvers/inbox-conversations.resolver';
import { ReplyAsOperatorResolver } from '@/modules/conversations/resolvers/reply-as-operator.resolver';
import { SimulationResolver } from '@/modules/conversations/resolvers/simulation.resolver';
import { TakeOverResolver } from '@/modules/conversations/resolvers/take-over.resolver';
import { ConversationActivityService } from '@/modules/conversations/services/conversation-activity.service';
import { ConversationHistoryService } from '@/modules/conversations/services/conversation-history.service';
import { ConversationMetricsService } from '@/modules/conversations/services/conversation-metrics.service';
import { ConversationRunsService } from '@/modules/conversations/services/conversation-runs.service';
import { ConversationTakeOverService } from '@/modules/conversations/services/conversation-take-over.service';
import { ConversationTimelineService } from '@/modules/conversations/services/conversation-timeline.service';
import { InboxActivityService } from '@/modules/conversations/services/inbox-activity.service';
import { InboxConversationsService } from '@/modules/conversations/services/inbox-conversations.service';
import { IncomingMessagesService } from '@/modules/conversations/services/incoming-messages.service';
import { OperatorConversationsService } from '@/modules/conversations/services/operator-conversations.service';
import { ScheduleAudienceService } from '@/modules/conversations/services/schedule-audience.service';
import { SimulationsService } from '@/modules/conversations/services/simulations.service';
import { CloseConversationUseCase } from '@/modules/conversations/use-cases/close-conversation.use-case';
import { CloseInactiveConversationsUseCase } from '@/modules/conversations/use-cases/close-inactive-conversations.use-case';
import { CloseSimulationForInactivityUseCase } from '@/modules/conversations/use-cases/close-simulation-for-inactivity.use-case';
import { GetInboxConversationUseCase } from '@/modules/conversations/use-cases/get-inbox-conversation.use-case';
import { GetInboxCountsUseCase } from '@/modules/conversations/use-cases/get-inbox-counts.use-case';
import { GetInboxNeedsYouCountUseCase } from '@/modules/conversations/use-cases/get-inbox-needs-you-count.use-case';
import { GetSimulationUseCase } from '@/modules/conversations/use-cases/get-simulation.use-case';
import { HandBackUseCase } from '@/modules/conversations/use-cases/hand-back.use-case';
import { ListInboxConversationsUseCase } from '@/modules/conversations/use-cases/list-inbox-conversations.use-case';
import { ReplyAsOperatorUseCase } from '@/modules/conversations/use-cases/reply-as-operator.use-case';
import { RestartSimulationUseCase } from '@/modules/conversations/use-cases/restart-simulation.use-case';
import { SendSimulatorMessageUseCase } from '@/modules/conversations/use-cases/send-simulator-message.use-case';
import { StartSimulationUseCase } from '@/modules/conversations/use-cases/start-simulation.use-case';
import { SubscribeToConversationActivityUseCase } from '@/modules/conversations/use-cases/subscribe-to-conversation-activity.use-case';
import { SubscribeToInboxActivityUseCase } from '@/modules/conversations/use-cases/subscribe-to-inbox-activity.use-case';
import { TakeOverFromTelegramUseCase } from '@/modules/conversations/use-cases/take-over-from-telegram.use-case';
import { TakeOverUseCase } from '@/modules/conversations/use-cases/take-over.use-case';
import { IdentityModule } from '@/modules/identity';
import { UsageModule } from '@/modules/usage';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';
import { TelegramModule } from '@/platform/telegram/telegram.module';

export class ConversationsModule extends defineModule({
  imports: [AgentsModule, IdentityModule, UsageModule, TelegramModule],
  providers: [
    ConversationsRepository,
    MessagesRepository,
    ScheduleContactsRepository,
    ScheduleAudienceService,
    ConversationActivityService,
    ConversationHistoryService,
    ConversationRunsService,
    ConversationTakeOverService,
    ConversationTimelineService,
    ConversationMetricsService,
    IncomingMessagesService,
    InboxActivityService,
    InboxConversationsService,
    SimulationsService,
    OperatorConversationsService,
    ListInboxConversationsUseCase,
    GetInboxConversationUseCase,
    GetInboxCountsUseCase,
    GetInboxNeedsYouCountUseCase,
    SubscribeToConversationActivityUseCase,
    SubscribeToInboxActivityUseCase,
    StartSimulationUseCase,
    GetSimulationUseCase,
    RestartSimulationUseCase,
    SendSimulatorMessageUseCase,
    ReplyAsOperatorUseCase,
    TakeOverUseCase,
    TakeOverFromTelegramUseCase,
    HandBackUseCase,
    CloseConversationUseCase,
    CloseInactiveConversationsUseCase,
    CloseSimulationForInactivityUseCase,
  ],
  resolvers: [
    ConversationActivityResolver,
    InboxActivityResolver,
    InboxConversationResolver,
    InboxConversationsResolver,
    SimulationResolver,
    TakeOverResolver,
    HandBackResolver,
    ReplyAsOperatorResolver,
    CloseConversationResolver,
  ],
  processors: [CloseInactiveConversationsProcessor],
  listeners: [TelegramAlertTakeOverListener],
  exports: [
    ConversationActivityService,
    ConversationHistoryService,
    ConversationRunsService,
    InboxActivityService,
    IncomingMessagesService,
    ScheduleAudienceService,
    ConversationsRepository,
    MessagesRepository,
  ],
}) {}
