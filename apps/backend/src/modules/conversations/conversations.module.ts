import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import { ConversationHistoryService } from '@/modules/conversations/services/conversation-history.service';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class ConversationsModule extends defineModule({
  providers: [ConversationsRepository, MessagesRepository, ConversationHistoryService],
  exports: [ConversationHistoryService],
}) {}
