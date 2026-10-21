import { index, jsonb, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { channels, channelsSchema } from '@/modules/channels/db/channels.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

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
      payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
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
