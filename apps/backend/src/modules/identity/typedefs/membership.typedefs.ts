import type { WorkspaceRole } from '@agent-ic/contracts';
import type { JoinOutcomeKind } from '@/modules/identity/constants/workspace.constants';
import type { memberships } from '@/modules/identity/db/memberships.table';
import type { Connection, ConnectionArgs } from '@/platform/graphql-server/typedefs/relay.typedefs';

export type MembershipRecord = typeof memberships.$inferSelect;

export type NewMembership = typeof memberships.$inferInsert;

export interface MemberRow {
  readonly membershipId: string;
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly role: WorkspaceRole;
  readonly lastActiveAt: Date | null;
  readonly joinedAt: Date;
}

export interface Member {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly role: WorkspaceRole;
  readonly lastActiveAt: Date | null;
  readonly joinedAt: Date;
}

export interface MembersPage {
  readonly members: Connection<Member>;
  readonly totalCount: number;
}

export type ListMembersInput = ConnectionArgs;

export type JoinOutcome =
  | { readonly kind: JoinOutcomeKind.Joined; readonly membership: MembershipRecord }
  | { readonly kind: JoinOutcomeKind.Invalid }
  | { readonly kind: JoinOutcomeKind.Expired };
