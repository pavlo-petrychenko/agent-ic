import { PermissionAction, PermissionResource, WorkspaceRole } from '@agent-ic/contracts';
import { useState } from 'react';
import { MemberAction } from '@/features/settings/constants/member.constants';
import type { UseMemberActionsResult } from '@/features/settings/typedefs/member.typedefs';
import type { TeamMember } from '@/features/settings/typedefs/member.typedefs';
import type { WorkspaceSummary } from '@/features/workspace';
import { hasPermission } from '@/shared/api/helpers/permission.helpers';

export function useMemberActions(
  active: WorkspaceSummary | null,
  userId: string,
  members: readonly TeamMember[],
): UseMemberActionsResult {
  const [transferOpen, setTransferOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  const canTransfer =
    active !== null &&
    hasPermission(
      active.permissions,
      PermissionResource.WorkspaceSettings,
      PermissionAction.Transfer,
    );
  const canLeave =
    active !== null &&
    hasPermission(active.permissions, PermissionResource.WorkspaceSettings, PermissionAction.Leave);
  const canRemove =
    active !== null &&
    hasPermission(active.permissions, PermissionResource.Team, PermissionAction.Delete);

  const actionFor = (member: TeamMember): MemberAction | null => {
    if (member.userId === userId) {
      if (canTransfer) {
        return MemberAction.TransferOwnership;
      }
      return canLeave ? MemberAction.LeaveWorkspace : null;
    }
    if (canRemove && member.role !== WorkspaceRole.Owner) {
      return MemberAction.RemoveMember;
    }
    return null;
  };

  const onAction = (rowId: string, action: MemberAction) => {
    const member = members.find((entry) => entry.id === rowId);
    if (member === undefined) {
      return;
    }
    if (action === MemberAction.TransferOwnership) {
      setTransferOpen(true);
      return;
    }
    if (action === MemberAction.LeaveWorkspace) {
      setLeaveOpen(true);
      return;
    }
    setRemoveTarget(member);
  };

  return {
    workspaceName: active?.name ?? '',
    actionFor,
    onAction,
    transferOpen,
    onTransferOpenChange: (open) => setTransferOpen(open),
    leaveOpen,
    onLeaveOpenChange: (open) => setLeaveOpen(open),
    removeTarget,
    onRemoveOpenChange: (open) => {
      if (!open) {
        setRemoveTarget(null);
      }
    },
  };
}
