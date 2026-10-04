import type { WorkspaceRole } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import { WorkspaceAccessService } from '@/platform/context/services/workspace-access.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class MembershipWorkspaceAccessService extends WorkspaceAccessService {
  constructor(
    private readonly memberships: MembershipsRepository,
    private readonly tenantTransactions: TenantTransactionService,
  ) {
    super();
  }

  resolveRole(userId: string, workspaceId: string): Promise<WorkspaceRole | null> {
    return this.tenantTransactions.run(workspaceId, () =>
      this.memberships.findRole(workspaceId, userId),
    );
  }
}
