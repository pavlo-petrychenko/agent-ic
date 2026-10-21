import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import { RolesRepository } from '@/modules/identity/repositories/roles.repository';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { WorkspacesRepository } from '@/modules/identity/repositories/workspaces.repository';
import { WorkspaceRolesService } from '@/modules/identity/services/workspace-roles.service';
import { FakeEmailGateway } from '@/modules/notifications/gateways/email.fake';
import { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';
import { MetricsService } from '@/platform/observability/services/metrics.service';

export class UsageNeighboursModule extends defineModule({
  global: true,
  providers: [
    UsersRepository,
    MembershipsRepository,
    WorkspacesRepository,
    RolesRepository,
    WorkspaceRolesService,
    MetricsService,
    { provide: EmailGateway, useClass: FakeEmailGateway },
  ],
  exports: [
    UsersRepository,
    MembershipsRepository,
    WorkspacesRepository,
    RolesRepository,
    WorkspaceRolesService,
    MetricsService,
    EmailGateway,
  ],
}) {}
