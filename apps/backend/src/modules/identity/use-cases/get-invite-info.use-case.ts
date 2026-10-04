import { Injectable } from '@nestjs/common';
import { INVITE_LOOKUP_RATE_LIMIT } from '@/modules/identity/constants/invite-rate-limit.constants';
import { clientSubject } from '@/modules/identity/helpers/rate-limit.helpers';
import { parseWorkspaceInput } from '@/modules/identity/helpers/workspace-input.helpers';
import { inviteTokenInputSchema } from '@/modules/identity/schemas/workspace-input.schema';
import { InviteLinksService } from '@/modules/identity/services/invite-links.service';
import type {
  InviteInfo,
  InviteTokenInput,
} from '@/modules/identity/typedefs/invite-link.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Injectable()
export class GetInviteInfoUseCase {
  constructor(
    private readonly rateLimits: RateLimitService,
    private readonly invites: InviteLinksService,
  ) {}

  async execute(ctx: UseCaseCtx, input: InviteTokenInput): Promise<InviteInfo> {
    await this.rateLimits.enforce(INVITE_LOOKUP_RATE_LIMIT, clientSubject(ctx));
    const { token } = parseWorkspaceInput(inviteTokenInputSchema, input);
    const invite = await this.invites.findUsable(token);
    return {
      workspaceName: invite.workspaceName,
      inviterName: invite.inviterName,
      memberCount: invite.memberCount,
      role: invite.role,
      expiresAt: invite.expiresAt,
    };
  }
}
