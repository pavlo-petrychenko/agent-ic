import { index, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import {
  CONVERSATIONS_SCHEMA,
  ChannelKind,
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import {
  moduleSchema,
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const conversationsSchema = moduleSchema(CONVERSATIONS_SCHEMA);

export const conversationModeEnum = conversationsSchema.enum('conversation_mode', [
  ConversationMode.Live,
  ConversationMode.Simulation,
]);

export const conversationStateEnum = conversationsSchema.enum('conversation_state', [
  ConversationState.AgentActive,
  ConversationState.Waiting,
  ConversationState.Handled,
  ConversationState.Closed,
]);

export const channelKindEnum = conversationsSchema.enum('channel_kind', [
  ChannelKind.Simulated,
  ChannelKind.Telegram,
  ChannelKind.Api,
]);

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
      state: conversationStateEnum('state').notNull(),
      handledBy: uuid('handled_by'),
      activeRunId: uuid('active_run_id'),
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
