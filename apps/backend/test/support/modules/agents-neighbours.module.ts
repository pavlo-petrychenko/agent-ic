import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { WorkspacesRepository } from '@/modules/identity/repositories/workspaces.repository';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class AgentsNeighboursModule extends defineModule({
  global: true,
  providers: [
    UsersRepository,
    MembershipsRepository,
    WorkspacesRepository,
    ConversationsRepository,
    MessagesRepository,
  ],
  exports: [
    UsersRepository,
    MembershipsRepository,
    WorkspacesRepository,
    ConversationsRepository,
    MessagesRepository,
  ],
}) {}
