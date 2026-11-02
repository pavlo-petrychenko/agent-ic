import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { parseConversationInput } from '@/modules/conversations/helpers/conversation-input.helpers';
import { inboxConversationInputSchema } from '@/modules/conversations/schemas/inbox.schema';
import { InboxConversationsService } from '@/modules/conversations/services/inbox-conversations.service';
import type {
  InboxConversationInput,
  InboxDetail,
} from '@/modules/conversations/typedefs/inbox.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class GetInboxConversationUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly inbox: InboxConversationsService,
  ) {}

  async execute(ctx: UseCaseCtx, input: InboxConversationInput): Promise<InboxDetail> {
    const { workspaceId, userId } = authorize(ctx, PermissionResource.Inbox, PermissionAction.View);
    const { id } = parseConversationInput(inboxConversationInputSchema, input);
    return this.tenants.run(workspaceId, () => this.inbox.get(workspaceId, userId, id));
  }
}
