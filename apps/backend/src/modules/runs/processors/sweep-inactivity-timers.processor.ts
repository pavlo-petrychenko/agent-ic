import { Injectable } from '@nestjs/common';
import {
  sweepInactivityTimersJob,
  sweepInactivityTimersSchedule,
} from '@/modules/runs/jobs/sweep-inactivity-timers.job';
import type { SweepInactivityTimersJobData } from '@/modules/runs/typedefs/run-job.typedefs';
import { SweepInactivityTimersUseCase } from '@/modules/runs/use-cases/sweep-inactivity-timers.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import { ScheduleJob } from '@/platform/queues/decorators/schedule-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@ProcessJob(sweepInactivityTimersJob)
@ScheduleJob(sweepInactivityTimersSchedule)
export class SweepInactivityTimersProcessor implements JobHandler<SweepInactivityTimersJobData> {
  constructor(private readonly sweepInactivityTimers: SweepInactivityTimersUseCase) {}

  async handle(ctx: UseCaseCtx): Promise<void> {
    await this.sweepInactivityTimers.execute(ctx);
  }
}
