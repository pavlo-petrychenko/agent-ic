import type { WorkspaceRole } from '@agent-ic/contracts';

export interface TeamMember {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: WorkspaceRole;
  readonly lastActiveAt: string | null;
}

export interface UseTeamMembersResult {
  readonly members: readonly TeamMember[];
  readonly loading: boolean;
}

export interface MemberRow {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly initials: string;
  readonly roleLabel: string;
  readonly lastActive: string;
}
