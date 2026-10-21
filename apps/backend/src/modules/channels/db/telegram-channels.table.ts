import { sql } from 'drizzle-orm';
import { boolean, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { channels, channelsSchema } from '@/modules/channels/db/channels.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const telegramChannels = channelsSchema
  .table(
    'telegram_channels',
    {
      channelId: uuid('channel_id')
        .primaryKey()
        .references(() => channels.id, { onDelete: 'cascade' }),
      workspaceId: workspaceIdColumn(),
      name: text('name').notNull(),
      botId: text('bot_id').notNull(),
      username: text('username').notNull(),
      tokenSealed: text('token_sealed').notNull(),
      webhookSecretHash: text('webhook_secret_hash'),
      showTyping: boolean('show_typing').notNull(),
    },
    (table) => [
      uniqueIndex('telegram_channels_bot_id_key')
        .on(table.botId)
        .where(sql`${table.botId} is not null`),
      tenantIsolationPolicy('telegram_channels'),
    ],
  )
  .enableRLS();
