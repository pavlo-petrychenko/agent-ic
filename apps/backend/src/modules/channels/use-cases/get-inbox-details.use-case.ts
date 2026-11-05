import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { InboxDetailsService } from '@/modules/channels/services/inbox-details.service';
import type {
  InboxDetails,
  InboxDetailsInput,
} from '@/modules/channels/typedefs/inbox-details.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class GetInboxDetailsUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly details: InboxDetailsService,
  ) {}

  execute(ctx: UseCaseCtx, input: InboxDetailsInput): Promise<InboxDetails> {
    const { workspaceId } = authorize(ctx, PermissionResource.Inbox, PermissionAction.View);
    return this.tenants.run(workspaceId, () => this.details.get(workspaceId, input.conversationId));
  }
}
