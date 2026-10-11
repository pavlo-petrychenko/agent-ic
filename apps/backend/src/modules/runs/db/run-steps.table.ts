import { integer, jsonb, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { RunStepStatus } from '@/modules/runs/constants/run.constants';
import { runs, runsSchema } from '@/modules/runs/db/runs.table';
import type { StepData } from '@/modules/runs/typedefs/run-step.typedefs';
import type { RunFailure } from '@/modules/runs/typedefs/run.typedefs';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const runStepStatusEnum = runsSchema.enum('run_step_status', [
  RunStepStatus.Running,
  RunStepStatus.Succeeded,
  RunStepStatus.Failed,
]);

export const runSteps = runsSchema
  .table(
    'run_steps',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn(),
      runId: uuid('run_id')
        .notNull()
        .references((): AnyPgColumn => runs.id, { onDelete: 'cascade' }),
      nodeId: text('node_id').notNull(),
      nodeKey: text('node_key').notNull(),
      branchKey: text('branch_key').notNull(),
      status: runStepStatusEnum('status').notNull(),
      attempt: integer('attempt').notNull(),
      input: jsonb('input').$type<StepData>().notNull(),
      output: jsonb('output').$type<StepData>(),
      port: text('port'),
      error: jsonb('error').$type<RunFailure>(),
      startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
      finishedAt: timestamp('finished_at', { withTimezone: true }),
    },
    (table) => [
      uniqueIndex('run_steps_run_id_node_id_branch_key_key').on(
        table.runId,
        table.nodeId,
        table.branchKey,
      ),
      tenantIsolationPolicy('run_steps'),
    ],
  )
  .enableRLS();
