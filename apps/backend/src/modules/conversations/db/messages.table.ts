import { isNotNull } from 'drizzle-orm';
import { foreignKey, index, text, timestamp, unique, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import {
  conversationsSchema,
  messageAuthorEnum,
  messageDeliveryEnum,
} from '@/modules/conversations/db/conversations.pg-schema';
import { conversations } from '@/modules/conversations/db/conversations.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { runs } from '@/modules/runs/db/runs.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const messages = conversationsSchema
  .table(
    'messages',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      conversationId: uuid('conversation_id').notNull(),
      author: messageAuthorEnum('author').notNull(),
      text: text('text').notNull(),
      quickReplies: text('quick_replies').array().notNull(),
      externalId: text('external_id'),
      idempotencyKey: text('idempotency_key'),
      delivery: messageDeliveryEnum('delivery'),
      runId: uuid('run_id').references((): AnyPgColumn => runs.id, { onDelete: 'set null' }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      foreignKey({
        name: 'messages_workspace_id_conversation_id_conversations_fk',
        columns: [table.workspaceId, table.conversationId],
        foreignColumns: [conversations.workspaceId, conversations.id],
      }).onDelete('cascade'),
      unique('messages_workspace_id_id_key').on(table.workspaceId, table.id),
      uniqueIndex('messages_conversation_id_external_id_key').on(
        table.conversationId,
        table.externalId,
      ),
      uniqueIndex('messages_workspace_id_idempotency_key_key').on(
        table.workspaceId,
        table.idempotencyKey,
      ),
      index('messages_history_idx').on(
        table.workspaceId,
        table.conversationId,
        table.createdAt,
        table.id,
      ),
      index('messages_run_id_idx').on(table.runId).where(isNotNull(table.runId)),
      tenantIsolationPolicy('messages'),
    ],
  )
  .enableRLS();
