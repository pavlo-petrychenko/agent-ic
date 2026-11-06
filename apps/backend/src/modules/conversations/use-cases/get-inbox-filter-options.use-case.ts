import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { InboxConversationsService } from '@/modules/conversations/services/inbox-conversations.service';
import type { InboxFilterOptions } from '@/modules/conversations/typedefs/inbox.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class GetInboxFilterOptionsUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly inbox: InboxConversationsService,
  ) {}

  execute(ctx: UseCaseCtx): Promise<InboxFilterOptions> {
    const { workspaceId } = authorize(ctx, PermissionResource.Inbox, PermissionAction.View);
    return this.tenants.run(workspaceId, () => this.inbox.filterOptions(workspaceId));
  }
}
