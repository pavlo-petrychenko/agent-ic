import { Injectable } from '@nestjs/common';
import { fireScheduleTickJob } from '@/modules/runs/jobs/fire-schedule-tick.job';
import type { FireScheduleTickJobData } from '@/modules/runs/typedefs/schedule-tick.typedefs';
import { FireScheduleTickUseCase } from '@/modules/runs/use-cases/fire-schedule-tick.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@ProcessJob(fireScheduleTickJob)
export class FireScheduleTickProcessor implements JobHandler<FireScheduleTickJobData> {
  constructor(private readonly fireTick: FireScheduleTickUseCase) {}

  async handle(ctx: UseCaseCtx, data: FireScheduleTickJobData): Promise<void> {
    await this.fireTick.execute(ctx, data);
  }
}
