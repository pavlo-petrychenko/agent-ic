import type { Locale } from '@agent-ic/contracts';
import type { emailTokens } from '@/modules/identity/db/email-tokens.table';

export type EmailTokenRecord = typeof emailTokens.$inferSelect;

export type NewEmailToken = typeof emailTokens.$inferInsert;

export interface IssuedConfirmation {
  readonly token: string;
  readonly email: string;
  readonly name: string;
  readonly locale: Locale;
}
