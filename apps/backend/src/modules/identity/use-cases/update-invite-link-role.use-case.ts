import { IdPrefix, PermissionAction, PermissionResource, WorkspaceRole } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { RoleNotFoundError } from '@/modules/identity/errors/role-not-found.error';
import { RoleNotInvitableError } from '@/modules/identity/errors/role-not-invitable.error';
import { parseWorkspaceInput } from '@/modules/identity/helpers/workspace-input.helpers';
import { InviteLinksRepository } from '@/modules/identity/repositories/invite-links.repository';
import { RolesRepository } from '@/modules/identity/repositories/roles.repository';
import { inviteRoleInputSchema } from '@/modules/identity/schemas/workspace-input.schema';
import { InviteLinksService } from '@/modules/identity/services/invite-links.service';
import { WorkspaceRolesService } from '@/modules/identity/services/workspace-roles.service';
import type {
  InviteLinkView,
  UpdateInviteLinkRoleInput,
} from '@/modules/identity/typedefs/invite-link.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class UpdateInviteLinkRoleUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly inviteLinks: InviteLinksRepository,
    private readonly roleRepository: RolesRepository,
    private readonly workspaceRoles: WorkspaceRolesService,
    private readonly invites: InviteLinksService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: UpdateInviteLinkRoleInput): Promise<InviteLinkView> {
    const access = authorize(ctx, PermissionResource.Team, PermissionAction.Edit);
    const data = parseWorkspaceInput(inviteRoleInputSchema, input);
    return this.tenantTransactions.run(access.workspaceId, async () => {
      const roleId =
        'roleId' in data
          ? this.ids.fromPublic(IdPrefix.Role, data.roleId)
          : await this.workspaceRoles.systemRoleId(access.workspaceId, data.role);
      const role = await this.roleRepository.findById(access.workspaceId, roleId);
      if (role === null) {
        throw new RoleNotFoundError(roleId);
      }
      if (role.isSystem && role.key === WorkspaceRole.Owner) {
        throw new RoleNotInvitableError(role.key);
      }
      const current = await this.inviteLinks.findActiveForUpdate(access.workspaceId);
      if (current === null) {
        return this.invites.view(
          await this.invites.issue(access.workspaceId, roleId, access.userId),
        );
      }
      await this.inviteLinks.updateRoleId(access.workspaceId, current.id, roleId);
      return this.invites.view({ ...current, roleId });
    });
  }
}
