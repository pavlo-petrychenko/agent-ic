import type { WorkspaceRole } from '@agent-ic/contracts';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, sql } from 'drizzle-orm';
import { memberships } from '@/modules/identity/db/memberships.table';
import { rolePermissions } from '@/modules/identity/db/role-permissions.table';
import { roles } from '@/modules/identity/db/roles.table';
import type {
  NewRole,
  NewRolePermission,
  RolePermission,
  RoleRecord,
  RoleWithPermissions,
} from '@/modules/identity/typedefs/role.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { storedRow } from '@/platform/database/helpers/stored-row.helpers';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class RolesRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async list(workspaceId: string): Promise<RoleWithPermissions[]> {
    const rows = await this.txHost.tx
      .select({
        id: roles.id,
        key: roles.key,
        name: roles.name,
        description: roles.description,
        isSystem: roles.isSystem,
      })
      .from(roles)
      .where(eq(roles.workspaceId, workspaceId))
      .orderBy(desc(roles.isSystem), asc(roles.key), asc(roles.name));
    const permissions = await this.txHost.tx
      .select({
        roleId: rolePermissions.roleId,
        resource: rolePermissions.resource,
        action: rolePermissions.action,
      })
      .from(rolePermissions)
      .where(eq(rolePermissions.workspaceId, workspaceId));
    const byRole = Object.groupBy(permissions, (permission) => permission.roleId);
    return rows.map((row) => ({
      ...row,
      permissions: (byRole[row.id] ?? []).map(({ resource, action }) => ({ resource, action })),
    }));
  }

  async findByKey(workspaceId: string, key: WorkspaceRole): Promise<RoleRecord | null> {
    const [role] = await this.txHost.tx
      .select()
      .from(roles)
      .where(and(eq(roles.workspaceId, workspaceId), eq(roles.key, key), eq(roles.isSystem, true)));
    return role ?? null;
  }

  async findById(workspaceId: string, id: string): Promise<RoleRecord | null> {
    const [role] = await this.txHost.tx
      .select()
      .from(roles)
      .where(and(eq(roles.workspaceId, workspaceId), eq(roles.id, id)));
    return role ?? null;
  }

  async findByIdForUpdate(workspaceId: string, id: string): Promise<RoleRecord | null> {
    const [role] = await this.txHost.tx
      .select()
      .from(roles)
      .where(and(eq(roles.workspaceId, workspaceId), eq(roles.id, id)))
      .for('update');
    return role ?? null;
  }

  async findByName(workspaceId: string, name: string): Promise<RoleRecord | null> {
    const [role] = await this.txHost.tx
      .select()
      .from(roles)
      .where(
        and(
          eq(roles.workspaceId, workspaceId),
          eq(roles.isSystem, false),
          sql`lower(${roles.name}) = lower(${name})`,
        ),
      );
    return role ?? null;
  }

  async insert(role: NewRole): Promise<RoleRecord> {
    const now = this.clock.now();
    return storedRow(
      await this.txHost.tx
        .insert(roles)
        .values({ ...role, createdAt: now, updatedAt: now })
        .returning(),
    );
  }

  async insertMany(rows: readonly NewRole[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }
    const now = this.clock.now();
    await this.txHost.tx
      .insert(roles)
      .values(rows.map((row) => ({ ...row, createdAt: now, updatedAt: now })))
      .onConflictDoNothing();
  }

  async insertPermissions(rows: readonly NewRolePermission[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }
    await this.txHost.tx
      .insert(rolePermissions)
      .values([...rows])
      .onConflictDoNothing();
  }

  async deletePermissions(workspaceId: string, roleId: string): Promise<void> {
    await this.txHost.tx
      .delete(rolePermissions)
      .where(and(eq(rolePermissions.workspaceId, workspaceId), eq(rolePermissions.roleId, roleId)));
  }

  async permissionsForRole(workspaceId: string, roleId: string): Promise<RolePermission[]> {
    const rows = await this.txHost.tx
      .select({ resource: rolePermissions.resource, action: rolePermissions.action })
      .from(rolePermissions)
      .where(and(eq(rolePermissions.workspaceId, workspaceId), eq(rolePermissions.roleId, roleId)));
    return rows.map((row) => ({ resource: row.resource, action: row.action }));
  }

  async rename(workspaceId: string, id: string, name: string): Promise<void> {
    await this.txHost.tx
      .update(roles)
      .set({ name, updatedAt: this.clock.now() })
      .where(and(eq(roles.workspaceId, workspaceId), eq(roles.id, id)));
  }

  async deleteById(workspaceId: string, id: string): Promise<void> {
    await this.txHost.tx
      .delete(roles)
      .where(and(eq(roles.workspaceId, workspaceId), eq(roles.id, id)));
  }

  async reassignMembers(workspaceId: string, fromRoleId: string, toRoleId: string): Promise<void> {
    await this.txHost.tx
      .update(memberships)
      .set({ roleId: toRoleId })
      .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.roleId, fromRoleId)));
  }

  async memberCounts(workspaceId: string): Promise<ReadonlyMap<string, number>> {
    const rows = await this.txHost.tx
      .select({ roleId: memberships.roleId, total: count() })
      .from(memberships)
      .where(eq(memberships.workspaceId, workspaceId))
      .groupBy(memberships.roleId);
    return new Map(rows.map((row) => [row.roleId, row.total]));
  }
}
