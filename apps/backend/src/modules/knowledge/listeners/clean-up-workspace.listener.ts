import { Injectable } from '@nestjs/common';
import type { WorkspaceDeletedInput } from '@/modules/identity';
import { cleanUpKnowledgeWorkspaceFilesJob } from '@/modules/knowledge/jobs/clean-up-knowledge-workspace-files.job';
import { CleanUpKnowledgeWorkspaceFilesUseCase } from '@/modules/knowledge/use-cases/clean-up-knowledge-workspace-files.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { OnDomainEvent } from '@/platform/domain-events/decorators/on-domain-event.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@OnDomainEvent(cleanUpKnowledgeWorkspaceFilesJob)
export class CleanUpWorkspaceListener implements JobHandler<WorkspaceDeletedInput> {
  constructor(
    private readonly cleanUpKnowledgeWorkspaceFiles: CleanUpKnowledgeWorkspaceFilesUseCase,
  ) {}

  handle(ctx: UseCaseCtx, data: WorkspaceDeletedInput): Promise<void> {
    return this.cleanUpKnowledgeWorkspaceFiles.execute(ctx, data);
  }
}
