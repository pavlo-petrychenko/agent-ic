import { index, timestamp, unique, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { users } from '@/modules/identity/db/users.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { notificationsSchema } from '@/modules/notifications/db/notifications.pg-schema';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const notificationSettings = notificationsSchema
  .table(
    'notification_settings',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      userId: uuid('user_id')
        .notNull()
        .references((): AnyPgColumn => users.id, { onDelete: 'cascade' }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      unique('notification_settings_workspace_id_id_key').on(table.workspaceId, table.id),
      uniqueIndex('notification_settings_workspace_id_user_id_key').on(
        table.workspaceId,
        table.userId,
      ),
      index('notification_settings_user_id_idx').on(table.userId),
      tenantIsolationPolicy('notification_settings'),
    ],
  )
  .enableRLS();
