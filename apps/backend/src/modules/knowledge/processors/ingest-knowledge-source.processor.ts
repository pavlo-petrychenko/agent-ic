import { Injectable } from '@nestjs/common';
import { ingestKnowledgeSourceJob } from '@/modules/knowledge/jobs/ingest-knowledge-source.job';
import type { IngestKnowledgeSourceJobData } from '@/modules/knowledge/typedefs/knowledge-job.typedefs';
import { IngestKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/ingest-knowledge-source.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@ProcessJob(ingestKnowledgeSourceJob)
export class IngestKnowledgeSourceProcessor implements JobHandler<IngestKnowledgeSourceJobData> {
  constructor(private readonly ingestKnowledgeSource: IngestKnowledgeSourceUseCase) {}

  async handle(ctx: UseCaseCtx, data: IngestKnowledgeSourceJobData): Promise<void> {
    await this.ingestKnowledgeSource.execute(ctx, data);
  }
}
