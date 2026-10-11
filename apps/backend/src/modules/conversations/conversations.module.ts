import { AgentsModule } from '@/modules/agents';
import { CleanUpWorkspaceListener } from '@/modules/conversations/listeners/clean-up-workspace.listener';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import { ConversationActivityResolver } from '@/modules/conversations/resolvers/conversation-activity.resolver';
import { OperatorResolver } from '@/modules/conversations/resolvers/operator.resolver';
import { SimulationResolver } from '@/modules/conversations/resolvers/simulation.resolver';
import { ConversationActivityService } from '@/modules/conversations/services/conversation-activity.service';
import { ConversationHistoryService } from '@/modules/conversations/services/conversation-history.service';
import { ConversationRunsService } from '@/modules/conversations/services/conversation-runs.service';
import { IncomingMessagesService } from '@/modules/conversations/services/incoming-messages.service';
import { OperatorConversationsService } from '@/modules/conversations/services/operator-conversations.service';
import { SimulationsService } from '@/modules/conversations/services/simulations.service';
import { CleanUpWorkspaceUseCase } from '@/modules/conversations/use-cases/clean-up-workspace.use-case';
import { GetSimulationUseCase } from '@/modules/conversations/use-cases/get-simulation.use-case';
import { HandBackUseCase } from '@/modules/conversations/use-cases/hand-back.use-case';
import { ReplyAsOperatorUseCase } from '@/modules/conversations/use-cases/reply-as-operator.use-case';
import { RestartSimulationUseCase } from '@/modules/conversations/use-cases/restart-simulation.use-case';
import { SendSimulatorMessageUseCase } from '@/modules/conversations/use-cases/send-simulator-message.use-case';
import { StartSimulationUseCase } from '@/modules/conversations/use-cases/start-simulation.use-case';
import { SubscribeToConversationActivityUseCase } from '@/modules/conversations/use-cases/subscribe-to-conversation-activity.use-case';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class ConversationsModule extends defineModule({
  imports: [AgentsModule],
  providers: [
    ConversationsRepository,
    MessagesRepository,
    ConversationActivityService,
    ConversationHistoryService,
    ConversationRunsService,
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
    CleanUpWorkspaceUseCase,
  ],
  resolvers: [ConversationActivityResolver, SimulationResolver, OperatorResolver],
  listeners: [CleanUpWorkspaceListener],
  exports: [
    ConversationActivityService,
    ConversationHistoryService,
    ConversationRunsService,
    IncomingMessagesService,
  ],
}) {}
