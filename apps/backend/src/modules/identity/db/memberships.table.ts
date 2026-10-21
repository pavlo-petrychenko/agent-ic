import { foreignKey, index, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { identitySchema } from '@/modules/identity/db/identity.pg-schema';
import { inviteLinks } from '@/modules/identity/db/invite-links.table';
import { roles } from '@/modules/identity/db/roles.table';
import { users } from '@/modules/identity/db/users.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
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
      roleId: uuid('role_id').notNull(),
      inviteLinkId: uuid('invite_link_id').references((): AnyPgColumn => inviteLinks.id, {
        onDelete: 'set null',
      }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      foreignKey({
        columns: [table.workspaceId, table.roleId],
        foreignColumns: [roles.workspaceId, roles.id],
      }).onDelete('restrict'),
      uniqueIndex('memberships_workspace_id_user_id_key').on(table.workspaceId, table.userId),
      index('memberships_workspace_id_role_id_idx').on(table.workspaceId, table.roleId),
      index('memberships_user_id_idx').on(table.userId),
      index('memberships_invite_link_id_idx').on(table.inviteLinkId),
      tenantIsolationPolicy('memberships'),
    ],
  )
  .enableRLS();
