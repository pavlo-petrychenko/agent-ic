import { sql } from 'drizzle-orm';
import {
  boolean,
  foreignKey,
  index,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { agents } from '@/modules/agents/db/agents.table';
import { conversationsSchema } from '@/modules/conversations/db/conversations.pg-schema';
import { conversations } from '@/modules/conversations/db/conversations.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const scheduleContacts = conversationsSchema
  .table(
    'schedule_contacts',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      conversationId: uuid('conversation_id').notNull(),
      agentId: uuid('agent_id').notNull(),
      nodeId: text('node_id').notNull(),
      scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
      oncePerConversation: boolean('once_per_conversation').notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      foreignKey({
        name: 'schedule_contacts_workspace_id_conversation_id_conversations_fk',
        columns: [table.workspaceId, table.conversationId],
        foreignColumns: [conversations.workspaceId, conversations.id],
      }).onDelete('cascade'),
      foreignKey({
        name: 'schedule_contacts_workspace_id_agent_id_agents_fk',
        columns: [table.workspaceId, table.agentId],
        foreignColumns: [agents.workspaceId, agents.id],
      }).onDelete('cascade'),
      uniqueIndex('schedule_contacts_tick_key').on(
        table.workspaceId,
        table.conversationId,
        table.agentId,
        table.nodeId,
        table.scheduledFor,
      ),
      uniqueIndex('schedule_contacts_once_key')
        .on(table.workspaceId, table.conversationId, table.agentId, table.nodeId)
        .where(sql`${table.oncePerConversation}`),
      index('schedule_contacts_workspace_id_agent_id_idx').on(table.workspaceId, table.agentId),
      tenantIsolationPolicy('schedule_contacts'),
    ],
  )
  .enableRLS();
