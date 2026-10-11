import { PermissionAction, PermissionResource, WorkspaceRole } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import type { RoleMemberCount } from '@/modules/identity/typedefs/membership.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class CountMembersByRoleUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly memberships: MembershipsRepository,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<RoleMemberCount[]> {
    const { workspaceId } = authorize(ctx, PermissionResource.Agents, PermissionAction.Edit);
    const counts = await this.tenantTransactions.run(workspaceId, () =>
      this.memberships.countByRole(workspaceId),
    );
    return Object.values(WorkspaceRole).map((role) => ({
      role,
      count: counts.find((entry) => entry.role === role)?.count ?? 0,
    }));
  }
}
