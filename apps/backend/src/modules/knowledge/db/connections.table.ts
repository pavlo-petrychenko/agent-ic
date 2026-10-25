import { isNotNull } from 'drizzle-orm';
import { index, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { users } from '@/modules/identity/db/users.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import {
  knowledgeConnectionProviderEnum,
  knowledgeConnectionStatusEnum,
  knowledgeSchema,
} from '@/modules/knowledge/db/knowledge.pg-schema';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const connections = knowledgeSchema
  .table(
    'connections',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      provider: knowledgeConnectionProviderEnum('provider').notNull(),
      accountEmail: text('account_email').notNull(),
      accountSubject: text('account_subject').notNull(),
      sealedRefreshToken: text('sealed_refresh_token').notNull(),
      scopes: text('scopes').array(),
      status: knowledgeConnectionStatusEnum('status').notNull(),
      lastErrorCode: text('last_error_code'),
      lastErrorMessage: text('last_error_message'),
      lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
      createdByUserId: uuid('created_by_user_id').references((): AnyPgColumn => users.id, {
        onDelete: 'set null',
      }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      unique('connections_workspace_id_id_key').on(table.workspaceId, table.id),
      unique('connections_workspace_id_provider_account_subject_key').on(
        table.workspaceId,
        table.provider,
        table.accountSubject,
      ),
      index('connections_workspace_id_status_idx').on(table.workspaceId, table.status),
      index('connections_created_by_user_id_idx')
        .on(table.createdByUserId)
        .where(isNotNull(table.createdByUserId)),
      tenantIsolationPolicy('connections'),
    ],
  )
  .enableRLS();
