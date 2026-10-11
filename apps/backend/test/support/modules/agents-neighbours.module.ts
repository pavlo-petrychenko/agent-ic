import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class AgentsNeighboursModule extends defineModule({
  global: true,
  providers: [ConversationsRepository, MessagesRepository],
  exports: [ConversationsRepository, MessagesRepository],
}) {}
