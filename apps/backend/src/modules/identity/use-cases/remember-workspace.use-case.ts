import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { MeService } from '@/modules/identity/services/me.service';
import type { Me } from '@/modules/identity/typedefs/user.typedefs';
import type { RememberWorkspaceInput } from '@/modules/identity/typedefs/workspace.typedefs';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { requireUserActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class RememberWorkspaceUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly memberships: MembershipsRepository,
    private readonly users: UsersRepository,
    private readonly me: MeService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: RememberWorkspaceInput): Promise<Me> {
    const { userId } = requireUserActor(ctx);
    const workspaceId = this.ids.fromPublic(IdPrefix.Workspace, input.workspaceId);

    const user = await this.tenantTransactions.run(workspaceId, async () => {
      if ((await this.memberships.findRole(workspaceId, userId)) === null) {
        throw new WorkspaceAccessDeniedError();
      }
      return this.users.updateLastWorkspace(userId, workspaceId);
    });
    if (user === null) {
      throw new AuthenticationRequiredError();
    }
    return this.me.describe(user);
  }
}
