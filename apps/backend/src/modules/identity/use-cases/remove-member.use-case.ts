import { IdPrefix, PermissionAction, PermissionResource, WorkspaceRole } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { CannotDeleteOwnerError } from '@/modules/identity/errors/cannot-delete-owner.error';
import { CannotDeleteYourselfError } from '@/modules/identity/errors/cannot-delete-yourself.error';
import { TeamMemberNotFoundError } from '@/modules/identity/errors/team-member-not-found.error';
import { parseWorkspaceInput } from '@/modules/identity/helpers/workspace-input.helpers';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import { removeMemberInputSchema } from '@/modules/identity/schemas/workspace-input.schema';
import type { RemoveMemberInput } from '@/modules/identity/typedefs/workspace.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class RemoveMemberUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly memberships: MembershipsRepository,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: RemoveMemberInput): Promise<boolean> {
    const access = authorize(ctx, PermissionResource.Team, PermissionAction.Delete);
    const { membershipId } = parseWorkspaceInput(removeMemberInputSchema, input);
    const id = this.ids.fromPublic(IdPrefix.Membership, membershipId);
    return this.tenantTransactions.run(access.workspaceId, async () => {
      const member = await this.memberships.findByIdForUpdate(access.workspaceId, id);
      if (member === null) {
        throw new TeamMemberNotFoundError(membershipId);
      }
      if (member.role === WorkspaceRole.Owner) {
        throw new CannotDeleteOwnerError();
      }
      if (member.userId === access.userId) {
        throw new CannotDeleteYourselfError();
      }
      return this.memberships.deleteByUser(access.workspaceId, member.userId);
    });
  }
}
