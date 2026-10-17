import type { WorkspaceRole } from '@agent-ic/contracts';
import type { MemberAction } from '@/features/settings/constants/member.constants';

export interface TeamMember {
  readonly id: string;
  readonly userId: string;
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
  readonly role: WorkspaceRole;
  readonly roleLabel: string;
  readonly lastActive: string;
  readonly action: MemberAction | null;
  readonly roleEditable: boolean;
}

export interface UseChangeMemberRoleResult {
  readonly changeMemberRole: (membershipId: string, role: WorkspaceRole) => Promise<void>;
  readonly changing: boolean;
}

export interface UseMemberActionsResult {
  readonly workspaceName: string;
  readonly actionFor: (member: TeamMember) => MemberAction | null;
  readonly onAction: (rowId: string, action: MemberAction) => void;
  readonly transferOpen: boolean;
  readonly onTransferOpenChange: (open: boolean) => void;
  readonly leaveOpen: boolean;
  readonly onLeaveOpenChange: (open: boolean) => void;
  readonly removeTarget: TeamMember | null;
  readonly onRemoveOpenChange: (open: boolean) => void;
}
