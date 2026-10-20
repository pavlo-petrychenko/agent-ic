import { IdPrefix, PermissionAction, PermissionResource, WorkspaceRole } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { CannotChangeAdminRoleError } from '@/modules/identity/errors/cannot-change-admin-role.error';
import { CannotChangeOwnerRoleError } from '@/modules/identity/errors/cannot-change-owner-role.error';
import { TeamMemberNotFoundError } from '@/modules/identity/errors/team-member-not-found.error';
import { parseWorkspaceInput } from '@/modules/identity/helpers/workspace-input.helpers';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import { changeMemberRoleInputSchema } from '@/modules/identity/schemas/workspace-input.schema';
import { WorkspaceMembershipsService } from '@/modules/identity/services/workspace-memberships.service';
import type {
  ChangeMemberRoleInput,
  WorkspaceMembership,
} from '@/modules/identity/typedefs/workspace.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ChangeMemberRoleUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly memberships: MembershipsRepository,
    private readonly workspaceMemberships: WorkspaceMembershipsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ChangeMemberRoleInput): Promise<WorkspaceMembership> {
    const access = authorize(ctx, PermissionResource.Team, PermissionAction.Edit);
    const { membershipId, role } = parseWorkspaceInput(changeMemberRoleInputSchema, input);
    const id = this.ids.fromPublic(IdPrefix.Membership, membershipId);
    return this.tenantTransactions.run(access.workspaceId, async () => {
      const member = await this.memberships.findByIdForUpdate(access.workspaceId, id);
      if (member === null) {
        throw new TeamMemberNotFoundError(membershipId);
      }
      if (member.role === WorkspaceRole.Owner) {
        throw new CannotChangeOwnerRoleError();
      }
      if (access.role === WorkspaceRole.Admin && member.role === WorkspaceRole.Admin) {
        throw new CannotChangeAdminRoleError();
      }
      if (member.role !== role) {
        await this.memberships.updateRole(access.workspaceId, id, role);
      }
      return this.workspaceMemberships.describe(access.workspaceId, role);
    });
  }
}
