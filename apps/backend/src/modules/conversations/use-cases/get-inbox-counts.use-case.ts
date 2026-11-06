import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { parseConversationInput } from '@/modules/conversations/helpers/conversation-input.helpers';
import { inboxCountsInputSchema } from '@/modules/conversations/schemas/inbox.schema';
import { InboxConversationsService } from '@/modules/conversations/services/inbox-conversations.service';
import type {
  InboxCounts,
  InboxCountsInput,
} from '@/modules/conversations/typedefs/inbox.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class GetInboxCountsUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly inbox: InboxConversationsService,
  ) {}

  execute(ctx: UseCaseCtx, input: InboxCountsInput | null): Promise<InboxCounts> {
    const { workspaceId } = authorize(ctx, PermissionResource.Inbox, PermissionAction.View);
    const filter = parseConversationInput(inboxCountsInputSchema, input);
    return this.tenants.run(workspaceId, () => this.inbox.counts(workspaceId, filter));
  }
}
