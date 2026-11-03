import { Injectable } from '@nestjs/common';
import { cleanUpKnowledgeDocumentFilesJob } from '@/modules/knowledge/jobs/clean-up-knowledge-document-files.job';
import type { CleanUpKnowledgeDocumentFilesJobData } from '@/modules/knowledge/typedefs/knowledge-job.typedefs';
import { CleanUpKnowledgeDocumentFilesUseCase } from '@/modules/knowledge/use-cases/clean-up-knowledge-document-files.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@ProcessJob(cleanUpKnowledgeDocumentFilesJob)
export class CleanUpKnowledgeDocumentFilesProcessor implements JobHandler<CleanUpKnowledgeDocumentFilesJobData> {
  constructor(
    private readonly cleanUpKnowledgeDocumentFiles: CleanUpKnowledgeDocumentFilesUseCase,
  ) {}

  async handle(ctx: UseCaseCtx, data: CleanUpKnowledgeDocumentFilesJobData): Promise<void> {
    await this.cleanUpKnowledgeDocumentFiles.execute(ctx, data);
  }
}
