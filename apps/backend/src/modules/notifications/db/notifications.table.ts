import { desc, isNotNull } from 'drizzle-orm';
import { foreignKey, index, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { messages } from '@/modules/conversations/db/messages.table';
import { users } from '@/modules/identity/db/users.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import {
  notificationKindEnum,
  notificationsSchema,
} from '@/modules/notifications/db/notifications.pg-schema';
import { runSteps } from '@/modules/runs/db/run-steps.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const notifications = notificationsSchema
  .table(
    'notifications',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      userId: uuid('user_id')
        .notNull()
        .references((): AnyPgColumn => users.id, { onDelete: 'cascade' }),
      runStepId: uuid('run_step_id')
        .notNull()
        .references((): AnyPgColumn => runSteps.id, { onDelete: 'cascade' }),
      kind: notificationKindEnum('kind').notNull(),
      lastCustomerMessageId: uuid('last_customer_message_id'),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      foreignKey({
        name: 'notifications_workspace_id_last_customer_message_id_messages_fk',
        columns: [table.workspaceId, table.lastCustomerMessageId],
        foreignColumns: [messages.workspaceId, messages.id],
      }).onDelete('cascade'),
      unique('notifications_workspace_id_id_key').on(table.workspaceId, table.id),
      unique('notifications_run_step_id_user_id_kind_key').on(
        table.runStepId,
        table.userId,
        table.kind,
      ),
      index('notifications_workspace_id_user_id_created_at_idx').on(
        table.workspaceId,
        table.userId,
        desc(table.createdAt),
      ),
      index('notifications_workspace_id_run_step_id_idx').on(table.workspaceId, table.runStepId),
      index('notifications_user_id_idx').on(table.userId),
      index('notifications_workspace_id_last_customer_message_id_idx')
        .on(table.workspaceId, table.lastCustomerMessageId)
        .where(isNotNull(table.lastCustomerMessageId)),
      tenantIsolationPolicy('notifications'),
    ],
  )
  .enableRLS();
