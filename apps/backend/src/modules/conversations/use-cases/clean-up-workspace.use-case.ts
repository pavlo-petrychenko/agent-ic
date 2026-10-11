import { Injectable } from '@nestjs/common';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import type { WorkspaceDeletedInput } from '@/modules/identity';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class CleanUpWorkspaceUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly conversations: ConversationsRepository,
  ) {}

  async execute(ctx: UseCaseCtx, input: WorkspaceDeletedInput): Promise<void> {
    requireSystemActor(ctx);
    await this.tenantTransactions.run(input.workspaceId, () =>
      this.conversations.deleteByWorkspace(input.workspaceId),
    );
  }
}
