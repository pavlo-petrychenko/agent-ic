import type { WorkspaceRole } from '@agent-ic/contracts';
import type { MemberAction } from '@/features/settings/constants/member.constants';
import type { MemberRow } from '@/features/settings/typedefs/member.typedefs';

export interface MemberRoleOption {
  role: WorkspaceRole;
  label: string;
}

export interface MemberListProps {
  rows: readonly MemberRow[];
  roleOptions: readonly MemberRoleOption[];
  onAction: (rowId: string, action: MemberAction) => void;
  onRoleChange: (rowId: string, role: WorkspaceRole) => void;
}
