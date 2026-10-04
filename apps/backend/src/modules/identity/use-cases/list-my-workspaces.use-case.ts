import { Injectable } from '@nestjs/common';
import { WorkspaceMembershipsService } from '@/modules/identity/services/workspace-memberships.service';
import type { WorkspaceMembership } from '@/modules/identity/typedefs/workspace.typedefs';
import { requireUserActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

@Injectable()
export class ListMyWorkspacesUseCase {
  constructor(private readonly workspaceMemberships: WorkspaceMembershipsService) {}

  async execute(ctx: UseCaseCtx): Promise<WorkspaceMembership[]> {
    const { userId } = requireUserActor(ctx);
    return this.workspaceMemberships.listFor(userId);
  }
}
