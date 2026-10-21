import { Injectable } from '@nestjs/common';
import type { WorkspaceDeletedInput } from '@/modules/identity';
import { cleanUpWorkspaceJob } from '@/modules/usage/jobs/clean-up-workspace.job';
import { CleanUpWorkspaceUseCase } from '@/modules/usage/use-cases/clean-up-workspace.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { OnDomainEvent } from '@/platform/domain-events/decorators/on-domain-event.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@OnDomainEvent(cleanUpWorkspaceJob)
export class CleanUpWorkspaceListener implements JobHandler<WorkspaceDeletedInput> {
  constructor(private readonly cleanUpWorkspace: CleanUpWorkspaceUseCase) {}

  handle(ctx: UseCaseCtx, data: WorkspaceDeletedInput): Promise<void> {
    return this.cleanUpWorkspace.execute(ctx, data);
  }
}
