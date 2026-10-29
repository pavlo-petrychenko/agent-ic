import { Injectable } from '@nestjs/common';
import {
  closeInactiveConversationsJob,
  closeInactiveConversationsSchedule,
} from '@/modules/conversations/jobs/close-inactive-conversations.job';
import type { CloseInactiveConversationsInput } from '@/modules/conversations/typedefs/auto-close.typedefs';
import { CloseInactiveConversationsUseCase } from '@/modules/conversations/use-cases/close-inactive-conversations.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import { ScheduleJob } from '@/platform/queues/decorators/schedule-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@ProcessJob(closeInactiveConversationsJob)
@ScheduleJob(closeInactiveConversationsSchedule)
export class CloseInactiveConversationsProcessor implements JobHandler<CloseInactiveConversationsInput> {
  constructor(private readonly closeInactive: CloseInactiveConversationsUseCase) {}

  handle(ctx: UseCaseCtx): Promise<void> {
    return this.closeInactive.execute(ctx);
  }
}
