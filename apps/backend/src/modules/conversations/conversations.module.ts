import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import { ConversationHistoryService } from '@/modules/conversations/services/conversation-history.service';
import { ConversationRunsService } from '@/modules/conversations/services/conversation-runs.service';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class ConversationsModule extends defineModule({
  providers: [
    ConversationsRepository,
    MessagesRepository,
    ConversationHistoryService,
    ConversationRunsService,
  ],
  exports: [ConversationHistoryService, ConversationRunsService],
}) {}
