import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  jsonb,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { agentVersions } from '@/modules/agents/db/agent-versions.table';
import { agents } from '@/modules/agents/db/agents.table';
import { conversationModeEnum } from '@/modules/conversations/db/conversations.pg-schema';
import { conversations } from '@/modules/conversations/db/conversations.table';
import { messages } from '@/modules/conversations/db/messages.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { RUN_TRIGGER_INPUT_JSON_TYPE, RunTrigger } from '@/modules/runs/constants/run.constants';
import { runStatusEnum, runTriggerEnum, runsSchema } from '@/modules/runs/db/runs.pg-schema';
import type { RunFailure, RunTriggerInput } from '@/modules/runs/typedefs/run.typedefs';
import { toSqlLiteral } from '@/platform/database/helpers/tenant-sql.helpers';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const runs = runsSchema
  .table(
    'runs',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      conversationId: uuid('conversation_id').notNull(),
      agentId: uuid('agent_id').notNull(),
      versionId: uuid('version_id').notNull(),
      mode: conversationModeEnum('mode').notNull(),
      trigger: runTriggerEnum('trigger').notNull(),
      triggerNodeId: text('trigger_node_id'),
      triggerInput: jsonb('trigger_input').$type<RunTriggerInput>(),
      status: runStatusEnum('status').notNull(),
      lastCoveredMessageId: uuid('last_covered_message_id').notNull(),
      error: jsonb('error').$type<RunFailure>(),
      traceId: text('trace_id'),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      startedAt: timestamp('started_at', { withTimezone: true }),
      finishedAt: timestamp('finished_at', { withTimezone: true }),
    },
    (table) => [
      foreignKey({
        name: 'runs_workspace_id_conversation_id_conversations_fk',
        columns: [table.workspaceId, table.conversationId],
        foreignColumns: [conversations.workspaceId, conversations.id],
      }).onDelete('cascade'),
      foreignKey({
        name: 'runs_workspace_id_agent_id_agents_fk',
        columns: [table.workspaceId, table.agentId],
        foreignColumns: [agents.workspaceId, agents.id],
      }).onDelete('no action'),
      foreignKey({
        name: 'runs_workspace_id_version_id_agent_versions_fk',
        columns: [table.workspaceId, table.versionId],
        foreignColumns: [agentVersions.workspaceId, agentVersions.id],
      }).onDelete('no action'),
      foreignKey({
        name: 'runs_workspace_id_last_covered_message_id_messages_fk',
        columns: [table.workspaceId, table.lastCoveredMessageId],
        foreignColumns: [messages.workspaceId, messages.id],
      }).onDelete('cascade'),
      unique('runs_workspace_id_id_key').on(table.workspaceId, table.id),
      check(
        'runs_trigger_node_only_for_trigger_runs',
        sql`(${table.trigger} = ${sql.raw(toSqlLiteral(RunTrigger.Message))}) = (${table.triggerNodeId} is null)`,
      ),
      check(
        'runs_trigger_input_only_for_trigger_runs',
        sql`${table.triggerInput} is null or (${table.trigger} <> ${sql.raw(toSqlLiteral(RunTrigger.Message))} and jsonb_typeof(${table.triggerInput}) = ${sql.raw(toSqlLiteral(RUN_TRIGGER_INPUT_JSON_TYPE))})`,
      ),
      index('runs_conversation_latest_idx').on(
        table.workspaceId,
        table.conversationId,
        table.createdAt,
        table.id,
      ),
      index('runs_agent_mode_created_at_idx').on(
        table.workspaceId,
        table.agentId,
        table.mode,
        table.createdAt,
      ),
      index('runs_workspace_id_version_id_idx').on(table.workspaceId, table.versionId),
      index('runs_workspace_id_last_covered_message_id_idx').on(
        table.workspaceId,
        table.lastCoveredMessageId,
      ),
      tenantIsolationPolicy('runs'),
    ],
  )
  .enableRLS();
