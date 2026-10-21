import { WorkspaceRole } from '@agent-ic/contracts';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, asc, count, eq, gt, inArray } from 'drizzle-orm';
import { memberships } from '@/modules/identity/db/memberships.table';
import { roles } from '@/modules/identity/db/roles.table';
import { users } from '@/modules/identity/db/users.table';
import type {
  MemberRow,
  MemberSelection,
  MembershipRecord,
  MembershipWithRole,
  NewMembership,
  RoleMemberCount,
} from '@/modules/identity/typedefs/membership.typedefs';
import type { RoleRef } from '@/modules/identity/typedefs/role.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class MembershipsRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async insertIfAbsent(membership: NewMembership): Promise<MembershipRecord | null> {
    const [created] = await this.txHost.tx
      .insert(memberships)
      .values({ ...membership, createdAt: this.clock.now() })
      .onConflictDoNothing({ target: [memberships.workspaceId, memberships.userId] })
      .returning();
    return created ?? null;
  }

  async findByUser(workspaceId: string, userId: string): Promise<MembershipRecord | null> {
    const [membership] = await this.txHost.tx
      .select()
      .from(memberships)
      .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, userId)));
    return membership ?? null;
  }

  async findRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
    const membership = await this.findRoleWithId(workspaceId, userId);
    return membership?.roleKey ?? null;
  }

  async findRoleWithId(workspaceId: string, userId: string): Promise<RoleRef | null> {
    const [row] = await this.txHost.tx
      .select({ roleId: memberships.roleId, roleKey: roles.key })
      .from(memberships)
      .innerJoin(roles, eq(roles.id, memberships.roleId))
      .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, userId)));
    return row ?? null;
  }

  async countByWorkspace(workspaceId: string): Promise<number> {
    const [row] = await this.txHost.tx
      .select({ total: count() })
      .from(memberships)
      .where(eq(memberships.workspaceId, workspaceId));
    return row?.total ?? 0;
  }

  countByRole(workspaceId: string): Promise<RoleMemberCount[]> {
    return this.txHost.tx
      .select({ role: roles.key, count: count() })
      .from(memberships)
      .innerJoin(roles, eq(roles.id, memberships.roleId))
      .where(eq(memberships.workspaceId, workspaceId))
      .groupBy(roles.key);
  }

  async countByInviteLink(workspaceId: string, inviteLinkId: string): Promise<number> {
    const [row] = await this.txHost.tx
      .select({ total: count() })
      .from(memberships)
      .where(
        and(eq(memberships.workspaceId, workspaceId), eq(memberships.inviteLinkId, inviteLinkId)),
      );
    return row?.total ?? 0;
  }

  async listNames(workspaceId: string, selection: MemberSelection): Promise<string[]> {
    const rows = await this.txHost.tx
      .select({ name: users.name })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .innerJoin(roles, eq(roles.id, memberships.roleId))
      .where(
        and(
          eq(memberships.workspaceId, workspaceId),
          'role' in selection
            ? eq(roles.key, selection.role)
            : inArray(memberships.userId, [...selection.userIds]),
        ),
      )
      .orderBy(asc(users.name));
    return rows.map(({ name }) => name);
  }

  listPage(workspaceId: string, afterId: string | null, limit: number): Promise<MemberRow[]> {
    const inWorkspace = eq(memberships.workspaceId, workspaceId);
    return this.txHost.tx
      .select({
        membershipId: memberships.id,
        userId: users.id,
        name: users.name,
        email: users.email,
        role: roles.key,
        roleId: memberships.roleId,
        lastActiveAt: users.lastActiveAt,
        joinedAt: memberships.createdAt,
      })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .innerJoin(roles, eq(roles.id, memberships.roleId))
      .where(afterId === null ? inWorkspace : and(inWorkspace, gt(memberships.id, afterId)))
      .orderBy(asc(memberships.id))
      .limit(limit);
  }

  async findOwnerForUpdate(workspaceId: string): Promise<MembershipRecord | null> {
    const ownerRoles = this.txHost.tx
      .select({ id: roles.id })
      .from(roles)
      .where(and(eq(roles.workspaceId, workspaceId), eq(roles.key, WorkspaceRole.Owner)));
    const [membership] = await this.txHost.tx
      .select()
      .from(memberships)
      .where(and(eq(memberships.workspaceId, workspaceId), inArray(memberships.roleId, ownerRoles)))
      .for('update');
    return membership ?? null;
  }

  async findByIdForUpdate(
    workspaceId: string,
    membershipId: string,
  ): Promise<MembershipWithRole | null> {
    const [row] = await this.txHost.tx
      .select({ membership: memberships, roleKey: roles.key })
      .from(memberships)
      .innerJoin(roles, eq(roles.id, memberships.roleId))
      .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.id, membershipId)))
      .for('update');
    return row === undefined ? null : { ...row.membership, roleKey: row.roleKey };
  }

  async updateRoleId(workspaceId: string, membershipId: string, roleId: string): Promise<void> {
    await this.txHost.tx
      .update(memberships)
      .set({ roleId })
      .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.id, membershipId)));
  }

  async deleteByUser(workspaceId: string, userId: string): Promise<boolean> {
    const deleted = await this.txHost.tx
      .delete(memberships)
      .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, userId)))
      .returning({ id: memberships.id });
    return deleted.length > 0;
  }
}
