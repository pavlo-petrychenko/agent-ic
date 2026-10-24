import { index, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import {
  channelKindEnum,
  conversationModeEnum,
  conversationStateEnum,
  conversationsSchema,
} from '@/modules/conversations/db/conversations.pg-schema';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const conversations = conversationsSchema
  .table(
    'conversations',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn(),
      agentId: uuid('agent_id').notNull(),
      mode: conversationModeEnum('mode').notNull(),
      channelKind: channelKindEnum('channel_kind').notNull(),
      channelId: text('channel_id'),
      endUserExternalId: text('end_user_external_id').notNull(),
      endUserName: text('end_user_name'),
      endUserLanguage: text('end_user_language'),
      state: conversationStateEnum('state').notNull(),
      handledBy: uuid('handled_by'),
      activeRunId: uuid('active_run_id'),
      simulationVersionId: uuid('simulation_version_id'),
      awaySentAt: timestamp('away_sent_at', { withTimezone: true }),
      lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull(),
      closedAt: timestamp('closed_at', { withTimezone: true }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      index('conversations_end_user_idx').on(
        table.workspaceId,
        table.agentId,
        table.channelKind,
        table.endUserExternalId,
      ),
      tenantIsolationPolicy('conversations'),
    ],
  )
  .enableRLS();
