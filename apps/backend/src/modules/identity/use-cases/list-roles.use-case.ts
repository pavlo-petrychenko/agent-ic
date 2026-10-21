import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { WorkspaceRolesService } from '@/modules/identity/services/workspace-roles.service';
import type { RoleView } from '@/modules/identity/typedefs/role.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class ListRolesUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly workspaceRoles: WorkspaceRolesService,
  ) {}

  execute(ctx: UseCaseCtx): Promise<RoleView[]> {
    const { workspaceId } = authorize(ctx, PermissionResource.Team, PermissionAction.View);
    return this.tenantTransactions.run(workspaceId, () => this.workspaceRoles.list(workspaceId));
  }
}
