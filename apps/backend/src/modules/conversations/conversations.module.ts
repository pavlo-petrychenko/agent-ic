import { AgentsModule } from '@/modules/agents';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import { ConversationActivityResolver } from '@/modules/conversations/resolvers/conversation-activity.resolver';
import { SimulationResolver } from '@/modules/conversations/resolvers/simulation.resolver';
import { ConversationActivityService } from '@/modules/conversations/services/conversation-activity.service';
import { ConversationHistoryService } from '@/modules/conversations/services/conversation-history.service';
import { ConversationRunsService } from '@/modules/conversations/services/conversation-runs.service';
import { IncomingMessagesService } from '@/modules/conversations/services/incoming-messages.service';
import { SimulationsService } from '@/modules/conversations/services/simulations.service';
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
    SubscribeToConversationActivityUseCase,
    StartSimulationUseCase,
  ],
  resolvers: [ConversationActivityResolver, SimulationResolver],
  exports: [
    ConversationActivityService,
    ConversationHistoryService,
    ConversationRunsService,
    IncomingMessagesService,
  ],
}) {}
