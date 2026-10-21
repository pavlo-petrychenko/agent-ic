import { sql } from 'drizzle-orm';
import { integer, numeric, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { CREDITS_PRECISION, CREDITS_SCALE } from '@/modules/usage/constants/usage.constants';
import { usageSchema } from '@/modules/usage/db/usage-counters.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const workspaceLimits = usageSchema
  .table(
    'workspace_limits',
    {
      id: uuid('id')
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      workspaceId: workspaceIdColumn(),
      creditsLimit: numeric('credits_limit', {
        precision: CREDITS_PRECISION,
        scale: CREDITS_SCALE,
        mode: 'number',
      }),
      conversationsLimit: integer('conversations_limit'),
      chunksLimit: integer('chunks_limit'),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
      unique('workspace_limits_workspace_id_key').on(table.workspaceId),
      tenantIsolationPolicy('workspace_limits'),
    ],
  )
  .enableRLS();
