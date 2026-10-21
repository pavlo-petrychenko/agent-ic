import { sql } from 'drizzle-orm';
import { boolean, index, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { identitySchema, workspaceRoleEnum } from '@/modules/identity/db/identity.pg-schema';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const roles = identitySchema
  .table(
    'roles',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      key: workspaceRoleEnum('key').notNull(),
      name: text('name'),
      description: text('description'),
      isSystem: boolean('is_system').notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .$onUpdateFn(() => new Date()),
    },
    (table) => [
      uniqueIndex('roles_workspace_id_id_key').on(table.workspaceId, table.id),
      uniqueIndex('roles_workspace_system_key')
        .on(table.workspaceId, table.key)
        .where(sql`${table.isSystem} = true`),
      uniqueIndex('roles_workspace_custom_name_key')
        .on(table.workspaceId, sql`lower(${table.name})`)
        .where(sql`${table.isSystem} = false`),
      index('roles_workspace_id_idx').on(table.workspaceId),
      tenantIsolationPolicy('roles'),
    ],
  )
  .enableRLS();
