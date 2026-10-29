import { AgentsModule } from '@/modules/agents';
import { CloseInactiveConversationsProcessor } from '@/modules/conversations/processors/close-inactive-conversations.processor';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import { ConversationActivityResolver } from '@/modules/conversations/resolvers/conversation-activity.resolver';
import { OperatorResolver } from '@/modules/conversations/resolvers/operator.resolver';
import { SimulationResolver } from '@/modules/conversations/resolvers/simulation.resolver';
import { ConversationActivityService } from '@/modules/conversations/services/conversation-activity.service';
import { ConversationHistoryService } from '@/modules/conversations/services/conversation-history.service';
import { ConversationMetricsService } from '@/modules/conversations/services/conversation-metrics.service';
import { ConversationRunsService } from '@/modules/conversations/services/conversation-runs.service';
import { IncomingMessagesService } from '@/modules/conversations/services/incoming-messages.service';
import { OperatorConversationsService } from '@/modules/conversations/services/operator-conversations.service';
import { SimulationsService } from '@/modules/conversations/services/simulations.service';
import { CloseInactiveConversationsUseCase } from '@/modules/conversations/use-cases/close-inactive-conversations.use-case';
import { CloseSimulationForInactivityUseCase } from '@/modules/conversations/use-cases/close-simulation-for-inactivity.use-case';
import { GetSimulationUseCase } from '@/modules/conversations/use-cases/get-simulation.use-case';
import { HandBackUseCase } from '@/modules/conversations/use-cases/hand-back.use-case';
import { ReplyAsOperatorUseCase } from '@/modules/conversations/use-cases/reply-as-operator.use-case';
import { RestartSimulationUseCase } from '@/modules/conversations/use-cases/restart-simulation.use-case';
import { SendSimulatorMessageUseCase } from '@/modules/conversations/use-cases/send-simulator-message.use-case';
import { StartSimulationUseCase } from '@/modules/conversations/use-cases/start-simulation.use-case';
import { SubscribeToConversationActivityUseCase } from '@/modules/conversations/use-cases/subscribe-to-conversation-activity.use-case';
import { UsageModule } from '@/modules/usage';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class ConversationsModule extends defineModule({
  imports: [AgentsModule, UsageModule],
  providers: [
    ConversationsRepository,
    MessagesRepository,
    ConversationActivityService,
    ConversationHistoryService,
    ConversationRunsService,
    ConversationMetricsService,
    IncomingMessagesService,
    SimulationsService,
    OperatorConversationsService,
    SubscribeToConversationActivityUseCase,
    StartSimulationUseCase,
    GetSimulationUseCase,
    RestartSimulationUseCase,
    SendSimulatorMessageUseCase,
    ReplyAsOperatorUseCase,
    HandBackUseCase,
    CloseInactiveConversationsUseCase,
    CloseSimulationForInactivityUseCase,
  ],
  resolvers: [ConversationActivityResolver, SimulationResolver, OperatorResolver],
  processors: [CloseInactiveConversationsProcessor],
  exports: [
    ConversationActivityService,
    ConversationHistoryService,
    ConversationRunsService,
    IncomingMessagesService,
  ],
}) {}
