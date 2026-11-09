import { Injectable } from '@nestjs/common';
import {
  clearExpiredTelegramLinksJob,
  clearExpiredTelegramLinksSchedule,
} from '@/modules/notifications/jobs/clear-expired-telegram-links.job';
import type { ClearExpiredTelegramLinksInput } from '@/modules/notifications/typedefs/telegram-link.typedefs';
import { ClearExpiredTelegramLinksUseCase } from '@/modules/notifications/use-cases/clear-expired-telegram-links.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import { ScheduleJob } from '@/platform/queues/decorators/schedule-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@ProcessJob(clearExpiredTelegramLinksJob)
@ScheduleJob(clearExpiredTelegramLinksSchedule)
export class ClearExpiredTelegramLinksProcessor implements JobHandler<ClearExpiredTelegramLinksInput> {
  constructor(private readonly clearExpired: ClearExpiredTelegramLinksUseCase) {}

  async handle(ctx: UseCaseCtx): Promise<void> {
    await this.clearExpired.execute(ctx);
  }
}
