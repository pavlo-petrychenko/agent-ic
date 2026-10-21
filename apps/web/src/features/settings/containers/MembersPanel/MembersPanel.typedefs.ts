import type { WorkspaceRole } from '@agent-ic/contracts';
import type { TeamMember } from '@/features/settings/typedefs/member.typedefs';
import type { MemberRoleOption } from '@/features/settings/view/MemberList';

export interface MembersPanelProps {
  readonly workspaceId: string;
}

export interface useMemberPanelResult {
  roleDrafts: Record<string, WorkspaceRole>;
  roleOptions: MemberRoleOption[];
  roleEditable: (member: TeamMember) => boolean;
  onRoleChange: (rowId: string, role: WorkspaceRole) => void;
}
