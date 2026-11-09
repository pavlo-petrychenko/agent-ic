import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { WorkspacesRepository } from '@/modules/identity/repositories/workspaces.repository';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class PromptsNeighboursModule extends defineModule({
  global: true,
  providers: [UsersRepository, WorkspacesRepository],
  exports: [UsersRepository, WorkspacesRepository],
}) {}
