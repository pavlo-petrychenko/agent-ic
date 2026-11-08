import { isNotNull } from 'drizzle-orm';
import { foreignKey, index, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { notificationChannels } from '@/modules/notifications/db/notification-channels.table';
import { notificationsSchema } from '@/modules/notifications/db/notifications.pg-schema';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const emailNotificationChannels = notificationsSchema
  .table(
    'email_notification_channels',
    {
      channelId: uuid('channel_id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      email: text('email'),
      verifiedAt: timestamp('verified_at', { withTimezone: true }),
      verificationTokenHash: text('verification_token_hash'),
      verificationExpiresAt: timestamp('verification_expires_at', { withTimezone: true }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      foreignKey({
        name: 'email_notification_channels_workspace_id_channel_id_channels_fk',
        columns: [table.workspaceId, table.channelId],
        foreignColumns: [notificationChannels.workspaceId, notificationChannels.id],
      }).onDelete('cascade'),
      index('email_notification_channels_workspace_id_channel_id_idx').on(
        table.workspaceId,
        table.channelId,
      ),
      uniqueIndex('email_notification_channels_verification_token_hash_key')
        .on(table.verificationTokenHash)
        .where(isNotNull(table.verificationTokenHash)),
      tenantIsolationPolicy('email_notification_channels'),
    ],
  )
  .enableRLS();
