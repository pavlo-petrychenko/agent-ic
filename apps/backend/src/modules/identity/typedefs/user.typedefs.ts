import type { Locale } from '@agent-ic/contracts';
import type { users } from '@/modules/identity/db/users.table';
import type { WorkspaceMembership } from '@/modules/identity/typedefs/workspace.typedefs';

export type UserRecord = typeof users.$inferSelect;

export type NewUser = typeof users.$inferInsert;

export interface Me {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly locale: Locale;
  readonly memberships: readonly WorkspaceMembership[];
}
