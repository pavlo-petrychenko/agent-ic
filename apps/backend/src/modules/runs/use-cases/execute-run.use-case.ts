import { Injectable } from '@nestjs/common';
import { runWorkspaceOf } from '@/modules/runs/helpers/run-ctx.helpers';
import { RunExecutionService } from '@/modules/runs/services/run-execution.service';
import { RunLifecycleService } from '@/modules/runs/services/run-lifecycle.service';
import type { ExecuteRunJobData } from '@/modules/runs/typedefs/run-job.typedefs';
import type { NewRun } from '@/modules/runs/typedefs/run.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { JobFailureAction } from '@/platform/errors/constants/job-failure.constants';
import { jobFailureActionFor } from '@/platform/errors/helpers/job-failure.helpers';

@Injectable()
export class ExecuteRunUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly execution: RunExecutionService,
    private readonly lifecycle: RunLifecycleService,
  ) {}

  async execute(ctx: UseCaseCtx, { runId }: ExecuteRunJobData): Promise<NewRun | null> {
    const workspaceId = runWorkspaceOf(ctx);
    try {
      await this.execution.execute(ctx, workspaceId, runId);
    } catch (error) {
      if (jobFailureActionFor(error) === JobFailureAction.GiveUp) {
        await this.tenants.run(workspaceId, async () => {
          await this.lifecycle.failRun(workspaceId, runId, error);
          await this.lifecycle.endRun(ctx, workspaceId, runId);
        });
      }
      throw error;
    }
    return this.tenants.run(workspaceId, () => this.lifecycle.endRun(ctx, workspaceId, runId));
  }
}
