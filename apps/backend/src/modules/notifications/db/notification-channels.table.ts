import { boolean, foreignKey, index, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { notificationSettings } from '@/modules/notifications/db/notification-settings.table';
import {
  notificationChannelEnum,
  notificationsSchema,
} from '@/modules/notifications/db/notifications.pg-schema';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const notificationChannels = notificationsSchema
  .table(
    'notification_channels',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      settingsId: uuid('settings_id').notNull(),
      channel: notificationChannelEnum('channel').notNull(),
      enabled: boolean('enabled').notNull().default(true),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      foreignKey({
        name: 'notification_channels_workspace_id_settings_id_settings_fk',
        columns: [table.workspaceId, table.settingsId],
        foreignColumns: [notificationSettings.workspaceId, notificationSettings.id],
      }).onDelete('cascade'),
      unique('notification_channels_workspace_id_id_key').on(table.workspaceId, table.id),
      unique('notification_channels_settings_id_channel_key').on(table.settingsId, table.channel),
      index('notification_channels_workspace_id_settings_id_idx').on(
        table.workspaceId,
        table.settingsId,
      ),
      tenantIsolationPolicy('notification_channels'),
    ],
  )
  .enableRLS();
