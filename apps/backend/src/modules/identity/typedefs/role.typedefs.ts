import type { PermissionAction, PermissionResource, WorkspaceRole } from '@agent-ic/contracts';
import type { rolePermissions } from '@/modules/identity/db/role-permissions.table';
import type { roles } from '@/modules/identity/db/roles.table';

export type RoleRecord = typeof roles.$inferSelect;

export type NewRole = typeof roles.$inferInsert;

export type RolePermissionRecord = typeof rolePermissions.$inferSelect;

export interface RoleRef {
  readonly roleId: string;
  readonly roleKey: WorkspaceRole;
}

export type NewRolePermission = typeof rolePermissions.$inferInsert;

export interface RolePermission {
  readonly resource: PermissionResource;
  readonly action: PermissionAction;
}

export interface RoleWithPermissions {
  readonly id: string;
  readonly key: WorkspaceRole;
  readonly name: string | null;
  readonly isSystem: boolean;
  readonly permissions: readonly RolePermission[];
}

export interface RoleView extends RoleWithPermissions {
  readonly memberCount: number;
}

export interface CreateRoleInput {
  readonly name: string;
  readonly baseRole: WorkspaceRole;
}

export interface RenameRoleInput {
  readonly roleId: string;
  readonly name: string;
}

export interface UpdateRolePermissionsInput {
  readonly roleId: string;
  readonly permissions: readonly RolePermission[];
}

export interface DeleteRoleInput {
  readonly roleId: string;
}
