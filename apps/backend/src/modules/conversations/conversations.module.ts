import { AgentsModule } from '@/modules/agents';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import { ConversationActivityResolver } from '@/modules/conversations/resolvers/conversation-activity.resolver';
import { ConversationActivityService } from '@/modules/conversations/services/conversation-activity.service';
import { ConversationHistoryService } from '@/modules/conversations/services/conversation-history.service';
import { ConversationRunsService } from '@/modules/conversations/services/conversation-runs.service';
import { IncomingMessagesService } from '@/modules/conversations/services/incoming-messages.service';
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
    SubscribeToConversationActivityUseCase,
  ],
  resolvers: [ConversationActivityResolver],
  exports: [
    ConversationActivityService,
    ConversationHistoryService,
    ConversationRunsService,
    IncomingMessagesService,
  ],
}) {}
