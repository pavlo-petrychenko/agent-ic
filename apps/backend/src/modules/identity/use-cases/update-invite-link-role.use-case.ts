import { isInvitableRole, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { RoleNotInvitableError } from '@/modules/identity/errors/role-not-invitable.error';
import { parseWorkspaceInput } from '@/modules/identity/helpers/workspace-input.helpers';
import { InviteLinksRepository } from '@/modules/identity/repositories/invite-links.repository';
import { inviteRoleInputSchema } from '@/modules/identity/schemas/workspace-input.schema';
import { InviteLinksService } from '@/modules/identity/services/invite-links.service';
import type {
  InviteLinkView,
  UpdateInviteLinkRoleInput,
} from '@/modules/identity/typedefs/invite-link.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class UpdateInviteLinkRoleUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly inviteLinks: InviteLinksRepository,
    private readonly invites: InviteLinksService,
  ) {}

  async execute(ctx: UseCaseCtx, input: UpdateInviteLinkRoleInput): Promise<InviteLinkView> {
    const access = authorize(ctx, PermissionResource.Team, PermissionAction.Edit);
    const { role } = parseWorkspaceInput(inviteRoleInputSchema, input);
    if (!isInvitableRole(role)) {
      throw new RoleNotInvitableError(role);
    }
    return this.tenantTransactions.run(access.workspaceId, async () => {
      const current = await this.inviteLinks.findActiveForUpdate(access.workspaceId);
      if (current === null) {
        return this.invites.view(await this.invites.issue(access.workspaceId, role, access.userId));
      }
      await this.inviteLinks.updateRole(access.workspaceId, current.id, role);
      return this.invites.view({ ...current, role });
    });
  }
}
