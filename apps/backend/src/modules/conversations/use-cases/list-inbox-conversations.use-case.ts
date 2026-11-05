import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { parseConversationInput } from '@/modules/conversations/helpers/conversation-input.helpers';
import { inboxConversationsInputSchema } from '@/modules/conversations/schemas/inbox.schema';
import { InboxConversationsService } from '@/modules/conversations/services/inbox-conversations.service';
import type {
  InboxConversationsInput,
  InboxSummary,
} from '@/modules/conversations/typedefs/inbox.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class ListInboxConversationsUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly inbox: InboxConversationsService,
  ) {}

  async execute(ctx: UseCaseCtx, input: InboxConversationsInput): Promise<readonly InboxSummary[]> {
    const { workspaceId, userId } = authorize(ctx, PermissionResource.Inbox, PermissionAction.View);
    const { limit } = parseConversationInput(inboxConversationsInputSchema, input);
    return this.tenants.run(workspaceId, () => this.inbox.list(workspaceId, userId, limit));
  }
}
