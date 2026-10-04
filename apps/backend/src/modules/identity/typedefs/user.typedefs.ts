import type { Locale } from '@agent-ic/contracts';
import type { users } from '@/modules/identity/db/users.table';

export type UserRecord = typeof users.$inferSelect;

export type NewUser = typeof users.$inferInsert;

export interface Me {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly locale: Locale;
}
