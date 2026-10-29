import { Injectable } from '@nestjs/common';
import { fireInactivityTimerJob } from '@/modules/runs/jobs/fire-inactivity-timer.job';
import type { FireInactivityTimerJobData } from '@/modules/runs/typedefs/run-job.typedefs';
import { FireInactivityTimerUseCase } from '@/modules/runs/use-cases/fire-inactivity-timer.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@ProcessJob(fireInactivityTimerJob)
export class FireInactivityTimerProcessor implements JobHandler<FireInactivityTimerJobData> {
  constructor(private readonly fireInactivityTimer: FireInactivityTimerUseCase) {}

  async handle(ctx: UseCaseCtx, data: FireInactivityTimerJobData): Promise<void> {
    await this.fireInactivityTimer.execute(ctx, data);
  }
}
