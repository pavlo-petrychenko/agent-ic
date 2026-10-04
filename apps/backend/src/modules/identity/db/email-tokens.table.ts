import { index, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { EmailTokenPurpose } from '@/modules/identity/constants/identity.constants';
import { identitySchema, users } from '@/modules/identity/db/users.table';

export const emailTokenPurposeEnum = identitySchema.enum('email_token_purpose', [
  EmailTokenPurpose.EmailConfirmation,
  EmailTokenPurpose.PasswordReset,
]);

export const emailTokens = identitySchema.table(
  'email_tokens',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    purpose: emailTokenPurposeEnum('purpose').notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('email_tokens_token_hash_key').on(table.tokenHash),
    index('email_tokens_user_id_idx').on(table.userId),
  ],
);
