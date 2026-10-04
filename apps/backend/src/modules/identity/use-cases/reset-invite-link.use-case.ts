import { DEFAULT_INVITE_ROLE, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { InviteLinksRepository } from '@/modules/identity/repositories/invite-links.repository';
import { InviteLinksService } from '@/modules/identity/services/invite-links.service';
import type { InviteLinkView } from '@/modules/identity/typedefs/invite-link.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class ResetInviteLinkUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly inviteLinks: InviteLinksRepository,
    private readonly invites: InviteLinksService,
    private readonly clock: ClockService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<InviteLinkView> {
    const access = authorize(ctx, PermissionResource.Team, PermissionAction.Edit);
    return this.tenantTransactions.run(access.workspaceId, async () => {
      const current = await this.inviteLinks.findActiveForUpdate(access.workspaceId);
      if (current !== null) {
        await this.inviteLinks.revoke(access.workspaceId, current.id, this.clock.now());
      }
      const next = await this.invites.issue(
        access.workspaceId,
        current?.role ?? DEFAULT_INVITE_ROLE,
        access.userId,
      );
      return this.invites.view(next);
    });
  }
}
