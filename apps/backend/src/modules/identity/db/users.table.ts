import { Locale } from '@agent-ic/contracts';
import { text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { IDENTITY_SCHEMA } from '@/modules/identity/constants/identity.constants';
import { moduleSchema } from '@/platform/database/helpers/tenant-table.helpers';

export const identitySchema = moduleSchema(IDENTITY_SCHEMA);

export const localeEnum = identitySchema.enum('locale', [Locale.En, Locale.Uk]);

export const users = identitySchema.table(
  'users',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    passwordHash: text('password_hash').notNull(),
    locale: localeEnum('locale').notNull(),
    emailConfirmedAt: timestamp('email_confirmed_at', { withTimezone: true }),
    pendingInviteLinkId: uuid('pending_invite_link_id'),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex('users_email_key').on(table.email)],
);
