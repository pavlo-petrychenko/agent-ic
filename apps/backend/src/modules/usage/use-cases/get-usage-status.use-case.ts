import { Injectable } from '@nestjs/common';
import { UsageViewsService } from '@/modules/usage/services/usage-views.service';
import type { UsageStatus } from '@/modules/usage/typedefs/usage.typedefs';
import { requireWorkspaceMember } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class GetUsageStatusUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly views: UsageViewsService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<UsageStatus> {
    const { workspaceId } = requireWorkspaceMember(ctx);
    return this.tenantTransactions.run(workspaceId, () => this.views.usageStatus(workspaceId));
  }
}
