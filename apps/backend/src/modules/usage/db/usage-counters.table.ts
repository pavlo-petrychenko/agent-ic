import { sql } from 'drizzle-orm';
import { check, integer, numeric, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import {
  CREDITS_PRECISION,
  CREDITS_SCALE,
  NO_USAGE,
  USAGE_PERIOD_PATTERN,
  USAGE_SCHEMA,
} from '@/modules/usage/constants/usage.constants';
import {
  moduleSchema,
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const usageSchema = moduleSchema(USAGE_SCHEMA);

export const usageCounters = usageSchema
  .table(
    'usage_counters',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      period: text('period').notNull(),
      credits: numeric('credits', {
        precision: CREDITS_PRECISION,
        scale: CREDITS_SCALE,
        mode: 'number',
      })
        .notNull()
        .default(NO_USAGE),
      conversations: integer('conversations').notNull().default(NO_USAGE),
      warned80At: timestamp('warned_80_at', { withTimezone: true }),
      warned100At: timestamp('warned_100_at', { withTimezone: true }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      unique('usage_counters_workspace_id_period_key').on(table.workspaceId, table.period),
      check(
        'usage_counters_period_format',
        sql`${table.period} ~ ${sql.raw(`'${USAGE_PERIOD_PATTERN}'`)}`,
      ),
      tenantIsolationPolicy('usage_counters'),
    ],
  )
  .enableRLS();
