import type { WorkspaceRole } from '@agent-ic/contracts';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, asc, count, eq, gt } from 'drizzle-orm';
import { memberships } from '@/modules/identity/db/memberships.table';
import { users } from '@/modules/identity/db/users.table';
import type {
  MemberRow,
  MembershipRecord,
  NewMembership,
} from '@/modules/identity/typedefs/membership.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class MembershipsRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insertIfAbsent(membership: NewMembership): Promise<MembershipRecord | null> {
    const [created] = await this.txHost.tx
      .insert(memberships)
      .values(membership)
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
    const membership = await this.findByUser(workspaceId, userId);
    return membership?.role ?? null;
  }

  async countByWorkspace(workspaceId: string): Promise<number> {
    const [row] = await this.txHost.tx
      .select({ total: count() })
      .from(memberships)
      .where(eq(memberships.workspaceId, workspaceId));
    return row?.total ?? 0;
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

  listPage(workspaceId: string, afterId: string | null, limit: number): Promise<MemberRow[]> {
    const inWorkspace = eq(memberships.workspaceId, workspaceId);
    return this.txHost.tx
      .select({
        membershipId: memberships.id,
        userId: users.id,
        name: users.name,
        email: users.email,
        role: memberships.role,
        lastActiveAt: users.lastActiveAt,
        joinedAt: memberships.createdAt,
      })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(afterId === null ? inWorkspace : and(inWorkspace, gt(memberships.id, afterId)))
      .orderBy(asc(memberships.id))
      .limit(limit);
  }
}
