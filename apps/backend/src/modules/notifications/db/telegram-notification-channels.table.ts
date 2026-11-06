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

export const telegramNotificationChannels = notificationsSchema
  .table(
    'telegram_notification_channels',
    {
      channelId: uuid('channel_id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      chatId: text('chat_id'),
      linkedAt: timestamp('linked_at', { withTimezone: true }),
      linkCodeHash: text('link_code_hash'),
      linkCodeExpiresAt: timestamp('link_code_expires_at', { withTimezone: true }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      foreignKey({
        name: 'telegram_notification_channels_workspace_id_channel_id_channels_fk',
        columns: [table.workspaceId, table.channelId],
        foreignColumns: [notificationChannels.workspaceId, notificationChannels.id],
      }).onDelete('cascade'),
      uniqueIndex('telegram_notification_channels_link_code_hash_key')
        .on(table.linkCodeHash)
        .where(isNotNull(table.linkCodeHash)),
      index('telegram_notification_channels_workspace_id_channel_id_idx').on(
        table.workspaceId,
        table.channelId,
      ),
      index('telegram_notification_channels_workspace_id_chat_id_idx').on(
        table.workspaceId,
        table.chatId,
      ),
      tenantIsolationPolicy('telegram_notification_channels'),
    ],
  )
  .enableRLS();
