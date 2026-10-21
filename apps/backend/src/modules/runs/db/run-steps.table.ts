import {
  foreignKey,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { runStepStatusEnum, runsSchema } from '@/modules/runs/db/runs.pg-schema';
import { runs } from '@/modules/runs/db/runs.table';
import type { StepData } from '@/modules/runs/typedefs/run-step.typedefs';
import type { RunFailure } from '@/modules/runs/typedefs/run.typedefs';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const runSteps = runsSchema
  .table(
    'run_steps',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      runId: uuid('run_id').notNull(),
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
      foreignKey({
        name: 'run_steps_workspace_id_run_id_runs_fk',
        columns: [table.workspaceId, table.runId],
        foreignColumns: [runs.workspaceId, runs.id],
      }).onDelete('cascade'),
      uniqueIndex('run_steps_run_id_node_id_branch_key_key').on(
        table.runId,
        table.nodeId,
        table.branchKey,
      ),
      index('run_steps_workspace_id_run_id_idx').on(table.workspaceId, table.runId),
      tenantIsolationPolicy('run_steps'),
    ],
  )
  .enableRLS();
