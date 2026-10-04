import { DEFAULT_INVITE_ROLE, IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { FIRST_MEMBER_COUNT } from '@/modules/identity/constants/workspace.constants';
import { parseWorkspaceInput } from '@/modules/identity/helpers/workspace-input.helpers';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import { WorkspacesRepository } from '@/modules/identity/repositories/workspaces.repository';
import { createWorkspaceInputSchema } from '@/modules/identity/schemas/workspace-input.schema';
import { InviteLinksService } from '@/modules/identity/services/invite-links.service';
import type {
  CreateWorkspaceInput,
  WorkspaceMembership,
} from '@/modules/identity/typedefs/workspace.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { requireUserActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class CreateWorkspaceUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly workspaces: WorkspacesRepository,
    private readonly memberships: MembershipsRepository,
    private readonly inviteLinks: InviteLinksService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: CreateWorkspaceInput): Promise<WorkspaceMembership> {
    const { userId } = requireUserActor(ctx);
    const data = parseWorkspaceInput(createWorkspaceInputSchema, input);
    const workspaceId = this.ids.generate();
    return this.tenantTransactions.run(workspaceId, async () => {
      const now = this.clock.now();
      await this.workspaces.insert({
        id: workspaceId,
        workspaceId,
        name: data.name,
        timeZone: data.timeZone,
        createdByUserId: userId,
        createdAt: now,
        updatedAt: now,
      });
      await this.memberships.insertIfAbsent({
        id: this.ids.generate(),
        workspaceId,
        userId,
        role: WorkspaceRole.Owner,
        inviteLinkId: null,
        createdAt: now,
      });
      await this.inviteLinks.issue(workspaceId, DEFAULT_INVITE_ROLE, userId);
      return {
        workspace: {
          id: this.ids.toPublic(IdPrefix.Workspace, workspaceId),
          name: data.name,
          timeZone: data.timeZone,
          memberCount: FIRST_MEMBER_COUNT,
        },
        role: WorkspaceRole.Owner,
      };
    });
  }
}
