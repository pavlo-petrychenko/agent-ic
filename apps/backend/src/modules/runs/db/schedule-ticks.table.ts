import {
  foreignKey,
  index,
  integer,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { agentVersions } from '@/modules/agents/db/agent-versions.table';
import { agents } from '@/modules/agents/db/agents.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { runsSchema, scheduleTickOutcomeEnum } from '@/modules/runs/db/runs.pg-schema';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const scheduleTicks = runsSchema
  .table(
    'schedule_ticks',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      agentId: uuid('agent_id').notNull(),
      versionId: uuid('version_id').notNull(),
      nodeId: text('node_id').notNull(),
      scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
      outcome: scheduleTickOutcomeEnum('outcome').notNull(),
      matched: integer('matched').notNull(),
      started: integer('started').notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      foreignKey({
        name: 'schedule_ticks_workspace_id_agent_id_agents_fk',
        columns: [table.workspaceId, table.agentId],
        foreignColumns: [agents.workspaceId, agents.id],
      }).onDelete('cascade'),
      foreignKey({
        name: 'schedule_ticks_workspace_id_version_id_agent_versions_fk',
        columns: [table.workspaceId, table.versionId],
        foreignColumns: [agentVersions.workspaceId, agentVersions.id],
      }).onDelete('cascade'),
      uniqueIndex('schedule_ticks_tick_key').on(
        table.workspaceId,
        table.agentId,
        table.nodeId,
        table.scheduledFor,
      ),
      index('schedule_ticks_workspace_id_version_id_idx').on(table.workspaceId, table.versionId),
      tenantIsolationPolicy('schedule_ticks'),
    ],
  )
  .enableRLS();
