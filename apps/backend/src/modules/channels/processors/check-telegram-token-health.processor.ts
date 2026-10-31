import { Injectable } from '@nestjs/common';
import {
  checkTelegramTokenHealthJob,
  checkTelegramTokenHealthSchedule,
} from '@/modules/channels/jobs/check-telegram-token-health.job';
import type { CheckTelegramTokenHealthInput } from '@/modules/channels/typedefs/telegram.typedefs';
import { CheckTelegramTokenHealthUseCase } from '@/modules/channels/use-cases/check-telegram-token-health.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import { ScheduleJob } from '@/platform/queues/decorators/schedule-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@ProcessJob(checkTelegramTokenHealthJob)
@ScheduleJob(checkTelegramTokenHealthSchedule)
export class CheckTelegramTokenHealthProcessor implements JobHandler<CheckTelegramTokenHealthInput> {
  constructor(private readonly checkHealth: CheckTelegramTokenHealthUseCase) {}

  async handle(ctx: UseCaseCtx): Promise<void> {
    await this.checkHealth.execute(ctx);
  }
}
