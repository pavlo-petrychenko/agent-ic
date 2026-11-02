import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { InboxConversationsService } from '@/modules/conversations/services/inbox-conversations.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class GetInboxNeedsYouCountUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly inbox: InboxConversationsService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<number> {
    const { workspaceId } = authorize(ctx, PermissionResource.Inbox, PermissionAction.View);
    return this.tenants.run(workspaceId, () => this.inbox.needsYouCount(workspaceId));
  }
}
