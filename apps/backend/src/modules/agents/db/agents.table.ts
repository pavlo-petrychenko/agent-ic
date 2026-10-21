import { isNotNull } from 'drizzle-orm';
import { index, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { agentVersions } from '@/modules/agents/db/agent-versions.table';
import { agentsSchema, pauseModeEnum } from '@/modules/agents/db/agents.pg-schema';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const agents = agentsSchema
  .table(
    'agents',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      name: text('name').notNull(),
      description: text('description'),
      liveVersionId: uuid('live_version_id').references((): AnyPgColumn => agentVersions.id, {
        onDelete: 'set null',
      }),
      draftVersionId: uuid('draft_version_id').references((): AnyPgColumn => agentVersions.id, {
        onDelete: 'set null',
      }),
      pausedAt: timestamp('paused_at', { withTimezone: true }),
      pauseMode: pauseModeEnum('pause_mode'),
      awayMessage: text('away_message'),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
      deletedAt: timestamp('deleted_at', { withTimezone: true }),
    },
    (table) => [
      unique('agents_workspace_id_id_key').on(table.workspaceId, table.id),
      index('agents_live_version_id_idx')
        .on(table.liveVersionId)
        .where(isNotNull(table.liveVersionId)),
      index('agents_draft_version_id_idx')
        .on(table.draftVersionId)
        .where(isNotNull(table.draftVersionId)),
      tenantIsolationPolicy('agents'),
    ],
  )
  .enableRLS();
