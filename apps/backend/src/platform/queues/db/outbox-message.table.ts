import { sql } from 'drizzle-orm';
import { index, jsonb, pgPolicy, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { DatabaseRole } from '@/platform/database/constants/database.constants';
import { WORKSPACE_ID_COLUMN } from '@/platform/database/constants/tenant.constants';
import { moduleSchema } from '@/platform/database/helpers/tenant-table.helpers';
import {
  OUTBOX_CREATED_AT_INDEX,
  OUTBOX_INSERT_POLICY,
  OUTBOX_INSERT_POLICY_COMMAND,
  OUTBOX_INSERT_POLICY_MODE,
  OUTBOX_MESSAGES_TABLE,
  OUTBOX_SCHEMA,
} from '@/platform/queues/constants/outbox.constants';
import type { QueueName } from '@/platform/queues/constants/queue.constants';
import type { JobEnvelope } from '@/platform/queues/typedefs/job.typedefs';

export const outboxSchema = moduleSchema(OUTBOX_SCHEMA);

export const outboxMessages = outboxSchema
  .table(
    OUTBOX_MESSAGES_TABLE,
    {
      id: uuid('id').primaryKey(),
      queue: text('queue').$type<QueueName>().notNull(),
      name: text('name').notNull(),
      envelope: jsonb('envelope').$type<JobEnvelope>().notNull(),
      workspaceId: uuid(WORKSPACE_ID_COLUMN),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      index(OUTBOX_CREATED_AT_INDEX).on(table.createdAt),
      pgPolicy(OUTBOX_INSERT_POLICY, {
        as: OUTBOX_INSERT_POLICY_MODE,
        for: OUTBOX_INSERT_POLICY_COMMAND,
        to: DatabaseRole.App,
        withCheck: sql`true`,
      }),
    ],
  )
  .enableRLS();
