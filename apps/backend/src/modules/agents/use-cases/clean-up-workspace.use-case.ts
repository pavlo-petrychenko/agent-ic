import { Injectable } from '@nestjs/common';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import type { WorkspaceDeletedInput } from '@/modules/identity';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class CleanUpWorkspaceUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentsRepository,
  ) {}

  async execute(ctx: UseCaseCtx, input: WorkspaceDeletedInput): Promise<void> {
    requireSystemActor(ctx);
    await this.tenantTransactions.run(input.workspaceId, () =>
      this.agents.deleteByWorkspace(input.workspaceId),
    );
  }
}
