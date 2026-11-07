import { foreignKey, index, integer, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
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
      attempts: integer('attempts').notNull().default(0),
      nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
      lockedUntil: timestamp('locked_until', { withTimezone: true }),
      lastError: text('last_error'),
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
      index('notification_deliveries_retry_idx').on(table.status, table.nextAttemptAt),
      tenantIsolationPolicy('notification_deliveries'),
    ],
  )
  .enableRLS();
