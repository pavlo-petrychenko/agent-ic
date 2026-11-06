import { foreignKey, index, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { NotificationDeliveryStatus } from '@/modules/notifications/constants/notification.constants';
import {
  notificationChannelEnum,
  notificationDeliveryStatusEnum,
  notificationsSchema,
} from '@/modules/notifications/db/notifications.pg-schema';
import { notifications } from '@/modules/notifications/db/notifications.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const notificationDeliveries = notificationsSchema
  .table(
    'notification_deliveries',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      notificationId: uuid('notification_id').notNull(),
      channel: notificationChannelEnum('channel').notNull(),
      status: notificationDeliveryStatusEnum('status')
        .notNull()
        .default(NotificationDeliveryStatus.Pending),
      sentAt: timestamp('sent_at', { withTimezone: true }),
      readAt: timestamp('read_at', { withTimezone: true }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      foreignKey({
        name: 'notification_deliveries_workspace_id_notification_id_notifications_fk',
        columns: [table.workspaceId, table.notificationId],
        foreignColumns: [notifications.workspaceId, notifications.id],
      }).onDelete('cascade'),
      unique('notification_deliveries_notification_id_channel_key').on(
        table.notificationId,
        table.channel,
      ),
      index('notification_deliveries_workspace_id_status_created_at_idx').on(
        table.workspaceId,
        table.status,
        table.createdAt,
      ),
      index('notification_deliveries_workspace_id_notification_id_idx').on(
        table.workspaceId,
        table.notificationId,
      ),
      tenantIsolationPolicy('notification_deliveries'),
    ],
  )
  .enableRLS();
