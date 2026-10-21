import { sql } from 'drizzle-orm';
import { check, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { identitySchema } from '@/modules/identity/db/identity.pg-schema';
import { users } from '@/modules/identity/db/users.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const workspaces = identitySchema
  .table(
    'workspaces',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn(),
      name: text('name').notNull(),
      timeZone: text('time_zone').notNull(),
      createdByUserId: uuid('created_by_user_id')
        .notNull()
        .references((): AnyPgColumn => users.id),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .$onUpdateFn(() => new Date()),
    },
    (table) => [
      check('workspaces_workspace_id_is_id', sql`${table.workspaceId} = ${table.id}`),
      tenantIsolationPolicy('workspaces'),
    ],
  )
  .enableRLS();
