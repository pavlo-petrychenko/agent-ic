import { Injectable } from '@nestjs/common';
import { reindexKnowledgeDocumentJob } from '@/modules/knowledge/jobs/reindex-knowledge-document.job';
import type { ReindexKnowledgeDocumentJobData } from '@/modules/knowledge/typedefs/knowledge-job.typedefs';
import { ReindexKnowledgeDocumentUseCase } from '@/modules/knowledge/use-cases/reindex-knowledge-document.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@ProcessJob(reindexKnowledgeDocumentJob)
export class ReindexKnowledgeDocumentProcessor implements JobHandler<ReindexKnowledgeDocumentJobData> {
  constructor(private readonly reindexKnowledgeDocument: ReindexKnowledgeDocumentUseCase) {}

  async handle(ctx: UseCaseCtx, data: ReindexKnowledgeDocumentJobData): Promise<void> {
    await this.reindexKnowledgeDocument.execute(ctx, data);
  }
}
