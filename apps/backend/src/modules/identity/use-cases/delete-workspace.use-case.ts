import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { DELETE_WORKSPACE_RATE_LIMIT } from '@/modules/identity/constants/rate-limit.constants';
import { InvalidCredentialsError } from '@/modules/identity/errors/invalid-credentials.error';
import { WorkspaceNameMismatchError } from '@/modules/identity/errors/workspace-name-mismatch.error';
import { workspaceDeletedEvent } from '@/modules/identity/events/workspace-deleted.event';
import { verifyPassword } from '@/modules/identity/helpers/password.helpers';
import { parseWorkspaceInput } from '@/modules/identity/helpers/workspace-input.helpers';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { WorkspacesRepository } from '@/modules/identity/repositories/workspaces.repository';
import { deleteWorkspaceInputSchema } from '@/modules/identity/schemas/workspace-input.schema';
import type { DeleteWorkspaceInput } from '@/modules/identity/typedefs/workspace.typedefs';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Injectable()
export class DeleteWorkspaceUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly rateLimits: RateLimitService,
    private readonly users: UsersRepository,
    private readonly workspaces: WorkspacesRepository,
    private readonly domainEvents: DomainEventsService,
  ) {}

  async execute(ctx: UseCaseCtx, input: DeleteWorkspaceInput): Promise<boolean> {
    const access = authorize(ctx, PermissionResource.WorkspaceSettings, PermissionAction.Delete);
    const { name, password } = parseWorkspaceInput(deleteWorkspaceInputSchema, input);
    await this.rateLimits.enforce(DELETE_WORKSPACE_RATE_LIMIT, access.userId);
    return this.tenantTransactions.run(access.workspaceId, async () => {
      const user = await this.users.findById(access.userId);
      const matches = await verifyPassword(user?.passwordHash ?? null, password);
      if (user === null || !matches) {
        throw new InvalidCredentialsError();
      }
      const workspace = await this.workspaces.findById(access.workspaceId);
      if (workspace === null) {
        throw new WorkspaceAccessDeniedError();
      }
      if (workspace.name !== name) {
        throw new WorkspaceNameMismatchError();
      }
      await this.users.clearLastWorkspace(access.workspaceId);
      await this.workspaces.delete(access.workspaceId);
      await this.domainEvents.emit(ctx, workspaceDeletedEvent, { workspaceId: access.workspaceId });
      return true;
    });
  }
}
