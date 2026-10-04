import { index, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { inviteLinks } from '@/modules/identity/db/invite-links.table';
import { identitySchema, users } from '@/modules/identity/db/users.table';
import { workspaceRoleEnum, workspaces } from '@/modules/identity/db/workspaces.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const memberships = identitySchema
  .table(
    'memberships',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      userId: uuid('user_id')
        .notNull()
        .references((): AnyPgColumn => users.id, { onDelete: 'cascade' }),
      role: workspaceRoleEnum('role').notNull(),
      inviteLinkId: uuid('invite_link_id').references((): AnyPgColumn => inviteLinks.id, {
        onDelete: 'set null',
      }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      uniqueIndex('memberships_workspace_id_user_id_key').on(table.workspaceId, table.userId),
      index('memberships_user_id_idx').on(table.userId),
      index('memberships_invite_link_id_idx').on(table.inviteLinkId),
      tenantIsolationPolicy('memberships'),
    ],
  )
  .enableRLS();
