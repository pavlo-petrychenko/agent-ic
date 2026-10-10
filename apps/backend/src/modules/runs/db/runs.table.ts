import { jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { ConversationMode } from '@/modules/conversations';
import { RUNS_SCHEMA, RunStatus, RunTrigger } from '@/modules/runs/constants/run.constants';
import type { RunFailure } from '@/modules/runs/typedefs/run.typedefs';
import {
  moduleSchema,
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const runsSchema = moduleSchema(RUNS_SCHEMA);

export const runModeEnum = runsSchema.enum('run_mode', [
  ConversationMode.Live,
  ConversationMode.Simulation,
]);

export const runTriggerEnum = runsSchema.enum('run_trigger', [RunTrigger.Message]);

export const runStatusEnum = runsSchema.enum('run_status', [
  RunStatus.Queued,
  RunStatus.Running,
  RunStatus.Succeeded,
  RunStatus.Failed,
  RunStatus.Escalated,
]);

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
    () => [tenantIsolationPolicy('runs')],
  )
  .enableRLS();
