import { IdPrefix, PermissionAction, PermissionResource, WorkspaceRole } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { TRANSFER_OWNERSHIP_RATE_LIMIT } from '@/modules/identity/constants/rate-limit.constants';
import { CannotTransferToYourselfError } from '@/modules/identity/errors/cannot-transfer-to-yourself.error';
import { InvalidCredentialsError } from '@/modules/identity/errors/invalid-credentials.error';
import { TeamMemberNotFoundError } from '@/modules/identity/errors/team-member-not-found.error';
import { verifyPassword } from '@/modules/identity/helpers/password.helpers';
import { parseWorkspaceInput } from '@/modules/identity/helpers/workspace-input.helpers';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { transferOwnershipInputSchema } from '@/modules/identity/schemas/workspace-input.schema';
import { WorkspaceMembershipsService } from '@/modules/identity/services/workspace-memberships.service';
import type {
  TransferOwnershipInput,
  WorkspaceMembership,
} from '@/modules/identity/typedefs/workspace.typedefs';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Injectable()
export class TransferOwnershipUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly rateLimits: RateLimitService,
    private readonly memberships: MembershipsRepository,
    private readonly users: UsersRepository,
    private readonly workspaces: WorkspaceMembershipsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: TransferOwnershipInput): Promise<WorkspaceMembership> {
    const access = authorize(ctx, PermissionResource.WorkspaceSettings, PermissionAction.Transfer);
    const { membershipId, password } = parseWorkspaceInput(transferOwnershipInputSchema, input);
    const targetMembershipId = this.ids.fromPublic(IdPrefix.Membership, membershipId);
    await this.rateLimits.enforce(TRANSFER_OWNERSHIP_RATE_LIMIT, access.userId);
    return this.tenantTransactions.run(access.workspaceId, async () => {
      const user = await this.users.findById(access.userId);
      const matches = await verifyPassword(user?.passwordHash ?? null, password);
      if (user === null || !matches) {
        throw new InvalidCredentialsError();
      }
      const owner = await this.memberships.findOwnerForUpdate(access.workspaceId);
      if (owner === null || owner.userId !== access.userId) {
        throw new PermissionDeniedError(
          PermissionResource.WorkspaceSettings,
          PermissionAction.Transfer,
        );
      }
      const target = await this.memberships.findByIdForUpdate(
        access.workspaceId,
        targetMembershipId,
      );
      if (target === null) {
        throw new TeamMemberNotFoundError(membershipId);
      }
      if (target.userId === access.userId) {
        throw new CannotTransferToYourselfError();
      }
      await this.memberships.updateRole(access.workspaceId, owner.id, WorkspaceRole.Admin);
      await this.memberships.updateRole(
        access.workspaceId,
        targetMembershipId,
        WorkspaceRole.Owner,
      );
      return this.workspaces.describe(access.workspaceId, WorkspaceRole.Admin);
    });
  }
}
