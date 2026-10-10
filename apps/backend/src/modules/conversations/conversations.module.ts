import { AgentsModule } from '@/modules/agents';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import { ConversationHistoryService } from '@/modules/conversations/services/conversation-history.service';
import { ConversationRunsService } from '@/modules/conversations/services/conversation-runs.service';
import { IncomingMessagesService } from '@/modules/conversations/services/incoming-messages.service';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class ConversationsModule extends defineModule({
  imports: [AgentsModule],
  providers: [
    ConversationsRepository,
    MessagesRepository,
    ConversationHistoryService,
    ConversationRunsService,
    IncomingMessagesService,
  ],
  exports: [ConversationHistoryService, ConversationRunsService, IncomingMessagesService],
}) {}
