import { sql } from 'drizzle-orm';
import { boolean, index, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import {
  CHANNELS_SCHEMA,
  ChannelStatus,
  ChannelType,
} from '@/modules/channels/constants/channel.constants';
import {
  moduleSchema,
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const channelsSchema = moduleSchema(CHANNELS_SCHEMA);

export const channelKindEnum = channelsSchema.enum('channel_kind', [
  ChannelType.Telegram,
  ChannelType.Api,
]);

export const channelStatusEnum = channelsSchema.enum('channel_status', [
  ChannelStatus.Pending,
  ChannelStatus.Connected,
  ChannelStatus.Broken,
  ChannelStatus.Disconnected,
]);

export const channels = channelsSchema
  .table(
    'channels',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn(),
      kind: channelKindEnum('kind').notNull(),
      status: channelStatusEnum('status').notNull(),
      agentId: uuid('agent_id'),
      name: text('name').notNull(),
      telegramBotId: text('telegram_bot_id'),
      telegramUsername: text('telegram_username'),
      tokenSealed: text('token_sealed'),
      webhookSecretHash: text('webhook_secret_hash'),
      showTyping: boolean('show_typing').notNull(),
      lastUpdateAt: timestamp('last_update_at', { withTimezone: true }),
      createdByUserId: uuid('created_by_user_id').notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      uniqueIndex('channels_telegram_bot_id_key')
        .on(table.telegramBotId)
        .where(sql`${table.telegramBotId} is not null and ${table.status} <> 'disconnected'`),
      index('channels_workspace_kind_idx').on(table.workspaceId, table.kind),
      index('channels_agent_id_idx').on(table.agentId),
      tenantIsolationPolicy('channels'),
    ],
  )
  .enableRLS();
