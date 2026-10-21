import { index, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import {
  conversationsSchema,
  messageAuthorEnum,
  messageDeliveryEnum,
} from '@/modules/conversations/db/conversations.pg-schema';
import { conversations } from '@/modules/conversations/db/conversations.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const messages = conversationsSchema
  .table(
    'messages',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn(),
      conversationId: uuid('conversation_id')
        .notNull()
        .references((): AnyPgColumn => conversations.id, { onDelete: 'cascade' }),
      author: messageAuthorEnum('author').notNull(),
      text: text('text').notNull(),
      quickReplies: text('quick_replies').array().notNull(),
      externalId: text('external_id'),
      idempotencyKey: text('idempotency_key'),
      delivery: messageDeliveryEnum('delivery'),
      runId: uuid('run_id'),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      uniqueIndex('messages_conversation_id_external_id_key').on(
        table.conversationId,
        table.externalId,
      ),
      uniqueIndex('messages_workspace_id_idempotency_key_key').on(
        table.workspaceId,
        table.idempotencyKey,
      ),
      index('messages_history_idx').on(table.conversationId, table.createdAt, table.id),
      tenantIsolationPolicy('messages'),
    ],
  )
  .enableRLS();
