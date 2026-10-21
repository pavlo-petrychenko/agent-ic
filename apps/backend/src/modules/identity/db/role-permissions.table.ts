import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { foreignKey, index, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { roles } from '@/modules/identity/db/roles.table';
import { identitySchema } from '@/modules/identity/db/users.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const permissionResourceEnum = identitySchema.enum('permission_resource', [
  PermissionResource.Agents,
  PermissionResource.Prompts,
  PermissionResource.KnowledgeBases,
  PermissionResource.Channels,
  PermissionResource.Inbox,
  PermissionResource.Testing,
  PermissionResource.Analytics,
  PermissionResource.Team,
  PermissionResource.WorkspaceSettings,
]);

export const permissionActionEnum = identitySchema.enum('permission_action', [
  PermissionAction.View,
  PermissionAction.Edit,
  PermissionAction.Publish,
  PermissionAction.Delete,
  PermissionAction.Transfer,
  PermissionAction.Leave,
]);

export const rolePermissions = identitySchema
  .table(
    'role_permissions',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn(),
      roleId: uuid('role_id').notNull(),
      resource: permissionResourceEnum('resource').notNull(),
      action: permissionActionEnum('action').notNull(),
    },
    (table) => [
      foreignKey({
        columns: [table.workspaceId, table.roleId],
        foreignColumns: [roles.workspaceId, roles.id],
      }).onDelete('cascade'),
      uniqueIndex('role_permissions_role_resource_action_key').on(
        table.roleId,
        table.resource,
        table.action,
      ),
      index('role_permissions_workspace_role_idx').on(table.workspaceId, table.roleId),
      tenantIsolationPolicy('role_permissions'),
    ],
  )
  .enableRLS();
