import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { InviteLinksRepository } from '@/modules/identity/repositories/invite-links.repository';
import { InviteLinksService } from '@/modules/identity/services/invite-links.service';
import type { InviteLinkView } from '@/modules/identity/typedefs/invite-link.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class GetInviteLinkUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly inviteLinks: InviteLinksRepository,
    private readonly invites: InviteLinksService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<InviteLinkView | null> {
    const { workspaceId } = authorize(ctx, PermissionResource.Team, PermissionAction.View);
    return this.tenantTransactions.run(workspaceId, async () => {
      const link = await this.inviteLinks.findActive(workspaceId);
      return link === null ? null : this.invites.view(link);
    });
  }
}
