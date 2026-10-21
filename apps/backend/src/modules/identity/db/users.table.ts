import { isNotNull } from 'drizzle-orm';
import { index, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { identitySchema, localeEnum } from '@/modules/identity/db/identity.pg-schema';
import { inviteLinks } from '@/modules/identity/db/invite-links.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';

export const users = identitySchema.table(
  'users',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull(),
    pendingEmail: text('pending_email'),
    name: text('name').notNull(),
    passwordHash: text('password_hash').notNull(),
    locale: localeEnum('locale').notNull(),
    emailConfirmedAt: timestamp('email_confirmed_at', { withTimezone: true }),
    pendingInviteLinkId: uuid('pending_invite_link_id').references(
      (): AnyPgColumn => inviteLinks.id,
      { onDelete: 'set null' },
    ),
    confirmationBindingHash: text('confirmation_binding_hash'),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
    lastWorkspaceId: uuid('last_workspace_id').references((): AnyPgColumn => workspaces.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('users_email_key').on(table.email),
    index('users_pending_invite_link_id_idx')
      .on(table.pendingInviteLinkId)
      .where(isNotNull(table.pendingInviteLinkId)),
    index('users_last_workspace_id_idx')
      .on(table.lastWorkspaceId)
      .where(isNotNull(table.lastWorkspaceId)),
  ],
);
