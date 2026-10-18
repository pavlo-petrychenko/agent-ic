import {
  hasPermission,
  IdPrefix,
  PermissionAction,
  PermissionResource,
  permissionsForRole,
} from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import type { WorkspaceIdInput } from '@/modules/identity/typedefs/workspace.typedefs';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { requireUserActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class LeaveWorkspaceUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly memberships: MembershipsRepository,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: WorkspaceIdInput): Promise<boolean> {
    const { userId } = requireUserActor(ctx);
    const workspaceId = this.ids.fromPublic(IdPrefix.Workspace, input.workspaceId);
    return this.tenantTransactions.run(workspaceId, async () => {
      const role = await this.memberships.findRole(workspaceId, userId);
      if (role === null) {
        throw new WorkspaceAccessDeniedError();
      }
      const permissions =
        ctx.permissions !== undefined && ctx.workspaceId === workspaceId
          ? ctx.permissions
          : permissionsForRole(role);
      if (
        !hasPermission(permissions, PermissionResource.WorkspaceSettings, PermissionAction.Leave)
      ) {
        throw new PermissionDeniedError(
          PermissionResource.WorkspaceSettings,
          PermissionAction.Leave,
        );
      }
      return this.memberships.deleteByUser(workspaceId, userId);
    });
  }
}
