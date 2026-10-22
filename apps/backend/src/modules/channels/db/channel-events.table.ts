import { index, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { ChannelEventType } from '@/modules/channels/constants/channel-event.constants';
import { channels, channelsSchema } from '@/modules/channels/db/channels.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const channelEventTypeEnum = channelsSchema.enum('channel_event_type', [
  ChannelEventType.Message,
  ChannelEventType.QuickReply,
]);

export const channelEvents = channelsSchema
  .table(
    'channel_events',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn(),
      channelId: uuid('channel_id')
        .notNull()
        .references(() => channels.id, { onDelete: 'cascade' }),
      externalId: text('external_id').notNull(),
      type: channelEventTypeEnum('type').notNull(),
      senderExternalId: text('sender_external_id').notNull(),
      senderName: text('sender_name'),
      text: text('text'),
      sentAt: timestamp('sent_at', { withTimezone: true }).notNull(),
      receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      uniqueIndex('channel_events_channel_external_id_key').on(table.channelId, table.externalId),
      index('channel_events_workspace_received_idx').on(table.workspaceId, table.receivedAt),
      index('channel_events_channel_received_idx').on(table.channelId, table.receivedAt.desc()),
      tenantIsolationPolicy('channel_events'),
    ],
  )
  .enableRLS();
