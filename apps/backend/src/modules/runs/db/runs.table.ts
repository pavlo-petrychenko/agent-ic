import { index, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import {
  runModeEnum,
  runStatusEnum,
  runTriggerEnum,
  runsSchema,
} from '@/modules/runs/db/runs.pg-schema';
import type { RunFailure } from '@/modules/runs/typedefs/run.typedefs';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const runs = runsSchema
  .table(
    'runs',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn(),
      conversationId: uuid('conversation_id').notNull(),
      agentId: uuid('agent_id').notNull(),
      versionId: uuid('version_id').notNull(),
      mode: runModeEnum('mode').notNull(),
      trigger: runTriggerEnum('trigger').notNull(),
      status: runStatusEnum('status').notNull(),
      lastCoveredMessageId: uuid('last_covered_message_id').notNull(),
      error: jsonb('error').$type<RunFailure>(),
      traceId: text('trace_id'),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      startedAt: timestamp('started_at', { withTimezone: true }),
      finishedAt: timestamp('finished_at', { withTimezone: true }),
    },
    (table) => [
      index('runs_conversation_latest_idx').on(table.conversationId, table.createdAt, table.id),
      tenantIsolationPolicy('runs'),
    ],
  )
  .enableRLS();
