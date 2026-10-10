import { Injectable } from '@nestjs/common';
import { executeRunJob } from '@/modules/runs/jobs/execute-run.job';
import type { ExecuteRunJobData } from '@/modules/runs/typedefs/run-job.typedefs';
import { ExecuteRunUseCase } from '@/modules/runs/use-cases/execute-run.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@ProcessJob(executeRunJob)
export class ExecuteRunProcessor implements JobHandler<ExecuteRunJobData> {
  constructor(private readonly executeRun: ExecuteRunUseCase) {}

  async handle(ctx: UseCaseCtx, data: ExecuteRunJobData): Promise<void> {
    await this.executeRun.execute(ctx, data);
  }
}
