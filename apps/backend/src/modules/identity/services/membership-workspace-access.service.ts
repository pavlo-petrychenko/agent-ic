import { permissionKey } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import { RolesRepository } from '@/modules/identity/repositories/roles.repository';
import { WorkspaceAccessService } from '@/platform/context/services/workspace-access.service';
import type { MemberAccess } from '@/platform/context/typedefs/workspace-access.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class MembershipWorkspaceAccessService extends WorkspaceAccessService {
  constructor(
    private readonly memberships: MembershipsRepository,
    private readonly roles: RolesRepository,
    private readonly tenantTransactions: TenantTransactionService,
  ) {
    super();
  }

  resolveAccess(userId: string, workspaceId: string): Promise<MemberAccess | null> {
    return this.tenantTransactions.run(workspaceId, async () => {
      const membership = await this.memberships.findRoleWithId(workspaceId, userId);
      if (membership === null) {
        return null;
      }
      const permissions = await this.roles.permissionsForRole(workspaceId, membership.roleId);
      return {
        workspaceId,
        role: membership.roleKey,
        permissions: new Set(permissions.map((it) => permissionKey(it.resource, it.action))),
      };
    });
  }
}
