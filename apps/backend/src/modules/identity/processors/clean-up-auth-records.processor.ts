import { Injectable } from '@nestjs/common';
import {
  cleanUpAuthRecordsJob,
  cleanUpAuthRecordsSchedule,
} from '@/modules/identity/jobs/clean-up-auth-records.job';
import type { AuthCleanupInput } from '@/modules/identity/typedefs/auth-cleanup.typedefs';
import { CleanUpAuthRecordsUseCase } from '@/modules/identity/use-cases/clean-up-auth-records.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import { ScheduleJob } from '@/platform/queues/decorators/schedule-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@ProcessJob(cleanUpAuthRecordsJob)
@ScheduleJob(cleanUpAuthRecordsSchedule)
export class CleanUpAuthRecordsProcessor implements JobHandler<AuthCleanupInput> {
  constructor(private readonly cleanUpAuthRecords: CleanUpAuthRecordsUseCase) {}

  handle(ctx: UseCaseCtx): Promise<void> {
    return this.cleanUpAuthRecords.execute(ctx);
  }
}
