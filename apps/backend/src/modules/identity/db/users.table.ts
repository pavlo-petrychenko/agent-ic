import { text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { identitySchema, localeEnum } from '@/modules/identity/db/identity.pg-schema';

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
    pendingInviteLinkId: uuid('pending_invite_link_id'),
    confirmationBindingHash: text('confirmation_binding_hash'),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
    lastWorkspaceId: uuid('last_workspace_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [uniqueIndex('users_email_key').on(table.email)],
);
