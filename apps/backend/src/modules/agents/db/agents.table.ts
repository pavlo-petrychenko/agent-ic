import { index, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { AGENTS_SCHEMA, PauseMode } from '@/modules/agents/constants/agent.constants';
import {
  moduleSchema,
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const agentsSchema = moduleSchema(AGENTS_SCHEMA);

export const pauseModeEnum = agentsSchema.enum('pause_mode', [
  PauseMode.Inbox,
  PauseMode.AwayMessage,
]);

export const agents = agentsSchema
  .table(
    'agents',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn(),
      name: text('name').notNull(),
      liveVersionId: uuid('live_version_id'),
      draftVersionId: uuid('draft_version_id'),
      pausedAt: timestamp('paused_at', { withTimezone: true }),
      pauseMode: pauseModeEnum('pause_mode'),
      awayMessage: text('away_message'),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      index('agents_workspace_id_idx').on(table.workspaceId, table.id),
      tenantIsolationPolicy('agents'),
    ],
  )
  .enableRLS();
