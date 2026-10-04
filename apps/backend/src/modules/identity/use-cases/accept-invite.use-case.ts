import { Injectable } from '@nestjs/common';
import { INVITE_LOOKUP_RATE_LIMIT } from '@/modules/identity/constants/invite-rate-limit.constants';
import { JoinOutcomeKind } from '@/modules/identity/constants/workspace.constants';
import { InviteExpiredError } from '@/modules/identity/errors/invite-expired.error';
import { InviteInvalidError } from '@/modules/identity/errors/invite-invalid.error';
import { clientSubject } from '@/modules/identity/helpers/rate-limit.helpers';
import { parseWorkspaceInput } from '@/modules/identity/helpers/workspace-input.helpers';
import { inviteTokenInputSchema } from '@/modules/identity/schemas/workspace-input.schema';
import { InviteLinksService } from '@/modules/identity/services/invite-links.service';
import { WorkspaceMembershipsService } from '@/modules/identity/services/workspace-memberships.service';
import type { InviteTokenInput } from '@/modules/identity/typedefs/invite-link.typedefs';
import type { WorkspaceMembership } from '@/modules/identity/typedefs/workspace.typedefs';
import { requireUserActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Injectable()
export class AcceptInviteUseCase {
  constructor(
    private readonly rateLimits: RateLimitService,
    private readonly tenantTransactions: TenantTransactionService,
    private readonly invites: InviteLinksService,
    private readonly workspaceMemberships: WorkspaceMembershipsService,
  ) {}

  async execute(ctx: UseCaseCtx, input: InviteTokenInput): Promise<WorkspaceMembership> {
    const { userId } = requireUserActor(ctx);
    await this.rateLimits.enforce(INVITE_LOOKUP_RATE_LIMIT, clientSubject(ctx));
    const { token } = parseWorkspaceInput(inviteTokenInputSchema, input);
    const invite = await this.invites.findUsable(token);
    return this.tenantTransactions.run(invite.workspaceId, async () => {
      const outcome = await this.invites.tryJoin(userId, invite.workspaceId, invite.id);
      if (outcome.kind === JoinOutcomeKind.Expired) {
        throw new InviteExpiredError();
      }
      if (outcome.kind === JoinOutcomeKind.Invalid) {
        throw new InviteInvalidError();
      }
      return this.workspaceMemberships.describe(invite.workspaceId, outcome.membership.role);
    });
  }
}
