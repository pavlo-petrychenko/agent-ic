import { Injectable } from '@nestjs/common';
import { cleanUpKnowledgeSourceFilesJob } from '@/modules/knowledge/jobs/clean-up-knowledge-source-files.job';
import type { CleanUpKnowledgeSourceFilesJobData } from '@/modules/knowledge/typedefs/knowledge-job.typedefs';
import { CleanUpKnowledgeSourceFilesUseCase } from '@/modules/knowledge/use-cases/clean-up-knowledge-source-files.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@ProcessJob(cleanUpKnowledgeSourceFilesJob)
export class CleanUpKnowledgeSourceFilesProcessor implements JobHandler<CleanUpKnowledgeSourceFilesJobData> {
  constructor(private readonly cleanUpKnowledgeSourceFiles: CleanUpKnowledgeSourceFilesUseCase) {}

  async handle(ctx: UseCaseCtx, data: CleanUpKnowledgeSourceFilesJobData): Promise<void> {
    await this.cleanUpKnowledgeSourceFiles.execute(ctx, data);
  }
}
