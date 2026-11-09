import { Injectable } from '@nestjs/common';
import { fireEscalationTimerJob } from '@/modules/runs/jobs/fire-escalation-timer.job';
import type { FireEscalationTimerJobData } from '@/modules/runs/typedefs/run-job.typedefs';
import { FireEscalationTimerUseCase } from '@/modules/runs/use-cases/fire-escalation-timer.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@ProcessJob(fireEscalationTimerJob)
export class FireEscalationTimerProcessor implements JobHandler<FireEscalationTimerJobData> {
  constructor(private readonly fireEscalationTimer: FireEscalationTimerUseCase) {}

  async handle(ctx: UseCaseCtx, data: FireEscalationTimerJobData): Promise<void> {
    await this.fireEscalationTimer.execute(ctx, data);
  }
}
