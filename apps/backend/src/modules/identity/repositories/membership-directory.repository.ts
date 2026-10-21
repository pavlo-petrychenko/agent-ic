import { Injectable } from '@nestjs/common';
import { asc, count, eq } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import {
  MEMBER_COUNT_COLUMN,
  MEMBER_COUNTS_ALIAS,
} from '@/modules/identity/constants/workspace.constants';
import { inviteLinks } from '@/modules/identity/db/invite-links.table';
import { memberships } from '@/modules/identity/db/memberships.table';
import { rolePermissions } from '@/modules/identity/db/role-permissions.table';
import { roles } from '@/modules/identity/db/roles.table';
import { users } from '@/modules/identity/db/users.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import type { DirectoryInvite } from '@/modules/identity/typedefs/invite-link.typedefs';
import type { RolePermission } from '@/modules/identity/typedefs/role.typedefs';
import type { DirectoryMembership } from '@/modules/identity/typedefs/workspace.typedefs';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';

@Injectable()
export class MembershipDirectoryRepository {
  constructor(private readonly systemDb: SystemDatabaseService) {}

  async listForUser(userId: string): Promise<DirectoryMembership[]> {
    const counts = this.memberCounts();
    const rows = await this.systemDb.db
      .select({
        workspaceId: workspaces.id,
        name: workspaces.name,
        timeZone: workspaces.timeZone,
        role: roles.key,
        memberCount: counts.memberCount,
      })
      .from(memberships)
      .innerJoin(workspaces, eq(workspaces.id, memberships.workspaceId))
      .innerJoin(roles, eq(roles.id, memberships.roleId))
      .innerJoin(counts, eq(counts.workspaceId, memberships.workspaceId))
      .where(eq(memberships.userId, userId))
      .orderBy(asc(memberships.createdAt), asc(memberships.id));
    if (rows.length === 0) {
      return [];
    }
    const permissions = await this.permissionsForUser(userId);
    return rows.map((row) => ({
      ...row,
      permissions: permissions.get(row.workspaceId) ?? [],
    }));
  }

  private async permissionsForUser(
    userId: string,
  ): Promise<ReadonlyMap<string, readonly RolePermission[]>> {
    const rows = await this.systemDb.db
      .select({
        workspaceId: memberships.workspaceId,
        resource: rolePermissions.resource,
        action: rolePermissions.action,
      })
      .from(memberships)
      .innerJoin(roles, eq(roles.id, memberships.roleId))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .where(eq(memberships.userId, userId));
    const byWorkspace = new Map<string, RolePermission[]>();
    for (const row of rows) {
      const list = byWorkspace.get(row.workspaceId) ?? [];
      list.push({ resource: row.resource, action: row.action });
      byWorkspace.set(row.workspaceId, list);
    }
    return byWorkspace;
  }

  findInviteByTokenHash(tokenHash: string): Promise<DirectoryInvite | null> {
    return this.findInvite(eq(inviteLinks.tokenHash, tokenHash));
  }

  findInviteById(id: string): Promise<DirectoryInvite | null> {
    return this.findInvite(eq(inviteLinks.id, id));
  }

  private async findInvite(condition: SQL): Promise<DirectoryInvite | null> {
    const counts = this.memberCounts();
    const [invite] = await this.systemDb.db
      .select({
        id: inviteLinks.id,
        workspaceId: inviteLinks.workspaceId,
        roleId: inviteLinks.roleId,
        role: roles.key,
        expiresAt: inviteLinks.expiresAt,
        revokedAt: inviteLinks.revokedAt,
        workspaceName: workspaces.name,
        inviterName: users.name,
        memberCount: counts.memberCount,
      })
      .from(inviteLinks)
      .innerJoin(roles, eq(roles.id, inviteLinks.roleId))
      .innerJoin(workspaces, eq(workspaces.id, inviteLinks.workspaceId))
      .innerJoin(users, eq(users.id, inviteLinks.createdByUserId))
      .innerJoin(counts, eq(counts.workspaceId, inviteLinks.workspaceId))
      .where(condition);
    return invite ?? null;
  }

  private memberCounts() {
    return this.systemDb.db
      .select({
        workspaceId: memberships.workspaceId,
        memberCount: count().as(MEMBER_COUNT_COLUMN),
      })
      .from(memberships)
      .groupBy(memberships.workspaceId)
      .as(MEMBER_COUNTS_ALIAS);
  }
}
