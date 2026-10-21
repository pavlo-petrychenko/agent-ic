import {
  can,
  INVITABLE_ROLES,
  PermissionAction,
  PermissionResource,
  WorkspaceRole,
} from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChangeMemberRole } from '@/features/settings/communication/hooks/useChangeMemberRole';
import { useTeamMembers } from '@/features/settings/communication/hooks/useTeamMembers';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { useMemberPanelResult } from '@/features/settings/containers/MembersPanel/MembersPanel.typedefs';
import type { TeamMember } from '@/features/settings/typedefs/member.typedefs';
import type { WorkspaceSummary } from '@/features/workspace';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useMembersPanel(active: WorkspaceSummary | null): useMemberPanelResult {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const { members } = useTeamMembers();
  const { changeMemberRole } = useChangeMemberRole();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();

  const [roleDrafts, setRoleDrafts] = useState<Readonly<Record<string, WorkspaceRole>>>({});

  const canEditRole =
    active !== null && can(active.role, PermissionResource.Team, PermissionAction.Edit);

  const roleOptions = INVITABLE_ROLES.map((role) => ({
    role,
    label: tCommon(`roles.name.${role}`),
  }));

  const roleEditable = (member: TeamMember): boolean => {
    if (!canEditRole || active === null || member.role === WorkspaceRole.Owner) {
      return false;
    }
    return !(active.role === WorkspaceRole.Admin && member.role === WorkspaceRole.Admin);
  };

  const clearRoleDraft = (membershipId: string) => {
    setRoleDrafts((current) =>
      Object.fromEntries(Object.entries(current).filter(([id]) => id !== membershipId)),
    );
  };

  const onRoleChange = (rowId: string, role: WorkspaceRole) => {
    const member = members.find((entry) => entry.id === rowId);
    if (member === undefined || member.role === role) {
      return;
    }
    setRoleDrafts((current) => ({ ...current, [rowId]: role }));
    void (async () => {
      try {
        await changeMemberRole(rowId, role);
        showToast({
          message: t('team.members.roleChanged', {
            name: member.name,
            role: tCommon(`roles.name.${role}`),
          }),
          tone: ToastTone.Ok,
        });
      } catch (caught) {
        showToast({ message: errorMessage(toAppError(caught)), tone: ToastTone.Err });
      } finally {
        clearRoleDraft(rowId);
      }
    })();
  };

  return {
    roleDrafts: roleDrafts,
    roleOptions: roleOptions,
    roleEditable: roleEditable,
    onRoleChange: onRoleChange,
  };
}
