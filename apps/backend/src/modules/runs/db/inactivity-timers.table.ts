import { isNotNull, sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { agentVersions } from '@/modules/agents/db/agent-versions.table';
import { conversations } from '@/modules/conversations/db/conversations.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { runsSchema } from '@/modules/runs/db/runs.pg-schema';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const inactivityTimers = runsSchema
  .table(
    'inactivity_timers',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      conversationId: uuid('conversation_id').notNull(),
      versionId: uuid('version_id').notNull(),
      nodeId: text('node_id').notNull(),
      anchorAt: timestamp('anchor_at', { withTimezone: true }).notNull(),
      attempt: integer('attempt').notNull(),
      dueAt: timestamp('due_at', { withTimezone: true }),
      leaseUntil: timestamp('lease_until', { withTimezone: true }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      foreignKey({
        name: 'inactivity_timers_workspace_id_conversation_id_conversations_fk',
        columns: [table.workspaceId, table.conversationId],
        foreignColumns: [conversations.workspaceId, conversations.id],
      }).onDelete('cascade'),
      foreignKey({
        name: 'inactivity_timers_workspace_id_version_id_agent_versions_fk',
        columns: [table.workspaceId, table.versionId],
        foreignColumns: [agentVersions.workspaceId, agentVersions.id],
      }).onDelete('cascade'),
      unique('inactivity_timers_workspace_id_conversation_id_key').on(
        table.workspaceId,
        table.conversationId,
      ),
      index('inactivity_timers_workspace_id_version_id_idx').on(table.workspaceId, table.versionId),
      index('inactivity_timers_due_at_idx').on(table.dueAt).where(isNotNull(table.dueAt)),
      check('inactivity_timers_attempt_check', sql`${table.attempt} >= 0`),
      tenantIsolationPolicy('inactivity_timers'),
    ],
  )
  .enableRLS();
