import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class CountAgentsUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentsRepository,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<number> {
    const { workspaceId } = authorize(ctx, PermissionResource.Agents, PermissionAction.View);
    return this.tenantTransactions.run(workspaceId, () =>
      this.agents.countByWorkspace(workspaceId),
    );
  }
}
