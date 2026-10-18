import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import {
  INVITE_LINK_TTL_SECONDS,
  JoinOutcomeKind,
} from '@/modules/identity/constants/workspace.constants';
import { InviteExpiredError } from '@/modules/identity/errors/invite-expired.error';
import { InviteInvalidError } from '@/modules/identity/errors/invite-invalid.error';
import { RoleNotFoundError } from '@/modules/identity/errors/role-not-found.error';
import { inviteLinkUrl } from '@/modules/identity/helpers/invite-link.helpers';
import { addSeconds, isPast } from '@/modules/identity/helpers/time.helpers';
import { InviteLinksRepository } from '@/modules/identity/repositories/invite-links.repository';
import { MembershipDirectoryRepository } from '@/modules/identity/repositories/membership-directory.repository';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import { RolesRepository } from '@/modules/identity/repositories/roles.repository';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { InviteTokensService } from '@/modules/identity/services/invite-tokens.service';
import type {
  DirectoryInvite,
  InviteLinkRecord,
  InviteLinkView,
} from '@/modules/identity/typedefs/invite-link.typedefs';
import type { JoinOutcome } from '@/modules/identity/typedefs/membership.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigService } from '@/platform/config/services/config.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class InviteLinksService {
  constructor(
    private readonly inviteLinks: InviteLinksRepository,
    private readonly memberships: MembershipsRepository,
    private readonly directory: MembershipDirectoryRepository,
    private readonly roles: RolesRepository,
    private readonly users: UsersRepository,
    private readonly tokens: InviteTokensService,
    private readonly tenantTransactions: TenantTransactionService,
    private readonly config: ConfigService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async issue(
    workspaceId: string,
    roleId: string,
    createdByUserId: string,
  ): Promise<InviteLinkRecord> {
    const now = this.clock.now();
    const id = this.ids.generate();
    const link: InviteLinkRecord = {
      id,
      workspaceId,
      tokenHash: this.tokens.derive(id).hash,
      roleId,
      createdByUserId,
      expiresAt: addSeconds(now, INVITE_LINK_TTL_SECONDS),
      revokedAt: null,
      createdAt: now,
    };
    await this.inviteLinks.insert(link);
    return link;
  }

  async view(link: InviteLinkRecord): Promise<InviteLinkView> {
    const role = await this.roles.findById(link.workspaceId, link.roleId);
    if (role === null) {
      throw new RoleNotFoundError(link.roleId);
    }
    return {
      url: inviteLinkUrl(this.config.config.publicUrl, this.tokens.derive(link.id).token),
      role: role.key,
      roleId: this.ids.toPublic(IdPrefix.Role, link.roleId),
      expiresAt: link.expiresAt,
      joinedCount: await this.memberships.countByInviteLink(link.workspaceId, link.id),
    };
  }

  async findUsable(token: string): Promise<DirectoryInvite> {
    const invite = await this.directory.findInviteByTokenHash(this.tokens.hash(token));
    if (invite === null || invite.revokedAt !== null) {
      throw new InviteInvalidError();
    }
    if (isPast(invite.expiresAt, this.clock.now())) {
      throw new InviteExpiredError();
    }
    return invite;
  }

  tryJoin(userId: string, workspaceId: string, inviteLinkId: string): Promise<JoinOutcome> {
    return this.tenantTransactions.run(workspaceId, async () => {
      const link = await this.inviteLinks.findByIdForShare(workspaceId, inviteLinkId);
      if (link === null || link.revokedAt !== null) {
        return { kind: JoinOutcomeKind.Invalid };
      }
      const now = this.clock.now();
      if (isPast(link.expiresAt, now)) {
        return { kind: JoinOutcomeKind.Expired };
      }
      const created = await this.memberships.insertIfAbsent({
        id: this.ids.generate(),
        workspaceId,
        userId,
        roleId: link.roleId,
        inviteLinkId: link.id,
        createdAt: now,
      });
      const membership = created ?? (await this.memberships.findByUser(workspaceId, userId));
      if (membership === null) {
        return { kind: JoinOutcomeKind.Invalid };
      }
      const role = await this.memberships.findRole(workspaceId, userId);
      return role === null
        ? { kind: JoinOutcomeKind.Invalid }
        : { kind: JoinOutcomeKind.Joined, membership, role };
    });
  }

  async completePending(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (user === null || user.pendingInviteLinkId === null) {
      return;
    }
    await this.users.clearPendingInvite(userId);
    const invite = await this.directory.findInviteById(user.pendingInviteLinkId);
    if (invite !== null) {
      await this.tryJoin(userId, invite.workspaceId, invite.id);
    }
  }
}
