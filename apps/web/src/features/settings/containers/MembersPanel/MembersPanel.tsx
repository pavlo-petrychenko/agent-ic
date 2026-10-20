import { useTranslation } from 'react-i18next';
import { useTeamMembers } from '@/features/settings/communication/hooks/useTeamMembers';
import { LAST_ACTIVE_FORMAT } from '@/features/settings/constants/member.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import { LeaveWorkspaceDialog } from '@/features/settings/containers/LeaveWorkspaceDialog';
import type { MembersPanelProps } from '@/features/settings/containers/MembersPanel/MembersPanel.typedefs';
import { useMembersPanel } from '@/features/settings/containers/MembersPanel/useMembersPanel';
import { RemoveMemberDialog } from '@/features/settings/containers/RemoveMemberDialog';
import { TransferOwnershipDialog } from '@/features/settings/containers/TransferOwnershipDialog';
import { formatDate } from '@/features/settings/logic/helpers/format.helpers';
import { useMemberActions } from '@/features/settings/logic/hooks/useMemberActions';
import { MemberList } from '@/features/settings/view/MemberList';
import { useActiveWorkspace, useWorkspaceShell } from '@/features/workspace';
import { toInitials } from '@/shared/i18n/helpers/initials.helpers';
import { useLocale } from '@/shared/i18n/hooks/useLocale';

export function MembersPanel({ workspaceId }: MembersPanelProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const { locale } = useLocale();
  const { members } = useTeamMembers();

  const userId = useWorkspaceShell(workspaceId).data?.user.userId ?? '';
  const active = useActiveWorkspace(workspaceId);
  const actions = useMemberActions(active, userId, members);
  const roles = useMembersPanel(active);

  return (
    <>
      <MemberList
        rows={members.map((member) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          initials: toInitials(member.name),
          role: roles.roleDrafts[member.id] ?? member.role,
          roleLabel: tCommon(`roles.name.${member.role}`),
          lastActive:
            member.lastActiveAt === null
              ? t('team.members.never')
              : formatDate(member.lastActiveAt, locale, LAST_ACTIVE_FORMAT),
          action: actions.actionFor(member),
          roleEditable: roles.roleEditable(member),
        }))}
        roleOptions={roles.roleOptions}
        onAction={actions.onAction}
        onRoleChange={roles.onRoleChange}
      />
      <TransferOwnershipDialog
        workspaceName={actions.workspaceName}
        open={actions.transferOpen}
        onOpenChange={actions.onTransferOpenChange}
      />
      <LeaveWorkspaceDialog
        workspaceId={workspaceId}
        workspaceName={actions.workspaceName}
        open={actions.leaveOpen}
        onOpenChange={actions.onLeaveOpenChange}
      />
      {actions.removeTarget === null ? null : (
        <RemoveMemberDialog
          key={actions.removeTarget.id}
          member={actions.removeTarget}
          roleLabel={tCommon(`roles.name.${actions.removeTarget.role}`)}
          workspaceName={actions.workspaceName}
          open
          onOpenChange={actions.onRemoveOpenChange}
        />
      )}
    </>
  );
}
