import { isNull } from 'drizzle-orm';
import { text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { identitySchema, users } from '@/modules/identity/db/users.table';
import { workspaceRoleEnum, workspaces } from '@/modules/identity/db/workspaces.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const inviteLinks = identitySchema
  .table(
    'invite_links',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      tokenHash: text('token_hash').notNull(),
      role: workspaceRoleEnum('role').notNull(),
      createdByUserId: uuid('created_by_user_id')
        .notNull()
        .references((): AnyPgColumn => users.id),
      expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
      revokedAt: timestamp('revoked_at', { withTimezone: true }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      uniqueIndex('invite_links_token_hash_key').on(table.tokenHash),
      uniqueIndex('invite_links_active_workspace_key')
        .on(table.workspaceId)
        .where(isNull(table.revokedAt)),
      tenantIsolationPolicy('invite_links'),
    ],
  )
  .enableRLS();
