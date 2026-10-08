import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { parseWorkspaceInput } from '@/modules/identity/helpers/workspace-input.helpers';
import { WorkspacesRepository } from '@/modules/identity/repositories/workspaces.repository';
import { renameWorkspaceInputSchema } from '@/modules/identity/schemas/workspace-input.schema';
import { WorkspaceMembershipsService } from '@/modules/identity/services/workspace-memberships.service';
import type { RenameWorkspaceInput } from '@/modules/identity/typedefs/workspace.typedefs';
import type { WorkspaceMembership } from '@/modules/identity/typedefs/workspace.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class RenameWorkspaceUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly workspaces: WorkspacesRepository,
    private readonly memberships: WorkspaceMembershipsService,
  ) {}

  async execute(ctx: UseCaseCtx, input: RenameWorkspaceInput): Promise<WorkspaceMembership> {
    const access = authorize(ctx, PermissionResource.WorkspaceSettings, PermissionAction.Edit);
    const { name } = parseWorkspaceInput(renameWorkspaceInputSchema, input);
    return this.tenantTransactions.run(access.workspaceId, async () => {
      await this.workspaces.rename(access.workspaceId, name);
      return this.memberships.describe(access.workspaceId, access.role);
    });
  }
}
