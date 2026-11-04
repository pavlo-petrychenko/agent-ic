import { Injectable } from '@nestjs/common';
import { scheduledKnowledgeSourceSyncJob } from '@/modules/knowledge/jobs/scheduled-knowledge-source-sync.job';
import type { ScheduledKnowledgeSourceSyncJobData } from '@/modules/knowledge/typedefs/knowledge-job.typedefs';
import { ScheduledKnowledgeSourceSyncUseCase } from '@/modules/knowledge/use-cases/scheduled-knowledge-source-sync.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@ProcessJob(scheduledKnowledgeSourceSyncJob)
export class ScheduledKnowledgeSourceSyncProcessor implements JobHandler<ScheduledKnowledgeSourceSyncJobData> {
  constructor(private readonly scheduledKnowledgeSourceSync: ScheduledKnowledgeSourceSyncUseCase) {}

  async handle(ctx: UseCaseCtx, data: ScheduledKnowledgeSourceSyncJobData): Promise<void> {
    await this.scheduledKnowledgeSourceSync.execute(ctx, data);
  }
}
