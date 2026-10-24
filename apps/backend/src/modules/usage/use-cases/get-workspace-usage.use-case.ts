import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { UsageViewsService } from '@/modules/usage/services/usage-views.service';
import type { WorkspaceUsage } from '@/modules/usage/typedefs/usage.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class GetWorkspaceUsageUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly views: UsageViewsService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<WorkspaceUsage> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.WorkspaceSettings,
      PermissionAction.View,
    );
    return this.tenantTransactions.run(workspaceId, () => this.views.workspaceUsage(workspaceId));
  }
}
