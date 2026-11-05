import { Injectable } from '@nestjs/common';
import {
  sweepScheduleTriggersJob,
  sweepScheduleTriggersSchedule,
} from '@/modules/runs/jobs/sweep-schedule-triggers.job';
import type { SweepScheduleTriggersJobData } from '@/modules/runs/typedefs/schedule-tick.typedefs';
import { SweepScheduleTriggersUseCase } from '@/modules/runs/use-cases/sweep-schedule-triggers.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import { ScheduleJob } from '@/platform/queues/decorators/schedule-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@ProcessJob(sweepScheduleTriggersJob)
@ScheduleJob(sweepScheduleTriggersSchedule)
export class SweepScheduleTriggersProcessor implements JobHandler<SweepScheduleTriggersJobData> {
  constructor(private readonly sweep: SweepScheduleTriggersUseCase) {}

  handle(ctx: UseCaseCtx): Promise<void> {
    return this.sweep.execute(ctx);
  }
}
