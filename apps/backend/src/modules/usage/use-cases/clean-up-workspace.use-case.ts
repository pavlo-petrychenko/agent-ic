import { Injectable } from '@nestjs/common';
import type { WorkspaceDeletedInput } from '@/modules/identity';
import { UsageCountersRepository } from '@/modules/usage/repositories/usage-counters.repository';
import { WorkspaceLimitsRepository } from '@/modules/usage/repositories/workspace-limits.repository';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class CleanUpWorkspaceUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly counters: UsageCountersRepository,
    private readonly limits: WorkspaceLimitsRepository,
  ) {}

  async execute(ctx: UseCaseCtx, input: WorkspaceDeletedInput): Promise<void> {
    requireSystemActor(ctx);
    await this.tenantTransactions.run(input.workspaceId, async () => {
      await this.counters.deleteByWorkspace(input.workspaceId);
      await this.limits.deleteByWorkspace(input.workspaceId);
    });
  }
}
