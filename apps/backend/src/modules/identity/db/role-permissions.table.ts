import { foreignKey, index, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import {
  identitySchema,
  permissionActionEnum,
  permissionResourceEnum,
} from '@/modules/identity/db/identity.pg-schema';
import { roles } from '@/modules/identity/db/roles.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

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
