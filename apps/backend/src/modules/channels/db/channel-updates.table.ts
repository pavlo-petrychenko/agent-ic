import { index, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { channels, channelsSchema } from '@/modules/channels/db/channels.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const channelUpdates = channelsSchema
  .table(
    'channel_updates',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn(),
      channelId: uuid('channel_id')
        .notNull()
        .references((): AnyPgColumn => channels.id, { onDelete: 'cascade' }),
      externalId: text('external_id').notNull(),
      receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      uniqueIndex('channel_updates_channel_external_id_key').on(table.channelId, table.externalId),
      index('channel_updates_workspace_received_idx').on(table.workspaceId, table.receivedAt),
      tenantIsolationPolicy('channel_updates'),
    ],
  )
  .enableRLS();
