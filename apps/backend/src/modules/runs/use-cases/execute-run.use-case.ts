import { Injectable } from '@nestjs/common';
import { runWorkspaceOf } from '@/modules/runs/helpers/run-ctx.helpers';
import { RunExecutionService } from '@/modules/runs/services/run-execution.service';
import { RunLifecycleService } from '@/modules/runs/services/run-lifecycle.service';
import type { ExecuteRunJobData } from '@/modules/runs/typedefs/run-job.typedefs';
import type { NewRun } from '@/modules/runs/typedefs/run.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class ExecuteRunUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly execution: RunExecutionService,
    private readonly lifecycle: RunLifecycleService,
  ) {}

  async execute(ctx: UseCaseCtx, { runId }: ExecuteRunJobData): Promise<NewRun | null> {
    const workspaceId = runWorkspaceOf(ctx);
    await this.execution.execute(ctx, workspaceId, runId);
    return this.tenants.run(workspaceId, () => this.lifecycle.endRun(ctx, workspaceId, runId));
  }
}
