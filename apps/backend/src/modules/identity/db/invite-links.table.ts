import { isNull } from 'drizzle-orm';
import { foreignKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { roles } from '@/modules/identity/db/roles.table';
import { identitySchema, users } from '@/modules/identity/db/users.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
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
      roleId: uuid('role_id').notNull(),
      createdByUserId: uuid('created_by_user_id')
        .notNull()
        .references((): AnyPgColumn => users.id),
      expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
      revokedAt: timestamp('revoked_at', { withTimezone: true }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      foreignKey({
        columns: [table.workspaceId, table.roleId],
        foreignColumns: [roles.workspaceId, roles.id],
      }).onDelete('restrict'),
      uniqueIndex('invite_links_token_hash_key').on(table.tokenHash),
      uniqueIndex('invite_links_active_workspace_key')
        .on(table.workspaceId)
        .where(isNull(table.revokedAt)),
      tenantIsolationPolicy('invite_links'),
    ],
  )
  .enableRLS();
