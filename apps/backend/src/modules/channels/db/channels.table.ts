import { CHANNEL_PROVIDERS } from '@agent-ic/contracts';
import { boolean, index, jsonb, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { CHANNELS_SCHEMA, ChannelStatus } from '@/modules/channels/constants/channel.constants';
import type { ChannelIdentity } from '@/modules/channels/typedefs/channel-identity.typedefs';
import {
  moduleSchema,
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const channelsSchema = moduleSchema(CHANNELS_SCHEMA);

export const channelKindEnum = channelsSchema.enum('channel_kind', CHANNEL_PROVIDERS);

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
      externalId: text('external_id').notNull(),
      identity: jsonb('identity').$type<ChannelIdentity>().notNull(),
      showTyping: boolean('show_typing').notNull(),
      credentialsSealed: text('credentials_sealed').notNull(),
      createdByUserId: uuid('created_by_user_id').notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      uniqueIndex('channels_kind_external_id_key').on(table.kind, table.externalId),
      index('channels_workspace_kind_idx').on(table.workspaceId, table.kind),
      index('channels_agent_id_idx').on(table.agentId),
      tenantIsolationPolicy('channels'),
    ],
  )
  .enableRLS();
