import { can, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLogOut } from '@/features/auth';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import { LeaveWorkspaceDialog } from '@/features/settings/containers/LeaveWorkspaceDialog';
import type { WorkspacesPanelProps } from '@/features/settings/containers/WorkspacesPanel/WorkspacesPanel.typedefs';
import { WorkspaceList } from '@/features/settings/view/WorkspaceList';
import { useWorkspaceShell } from '@/features/workspace';
import type { WorkspaceSummary } from '@/features/workspace';
import { toInitials } from '@/shared/i18n/helpers/initials.helpers';

export function WorkspacesPanel({ workspaceId }: WorkspacesPanelProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const { logOut } = useLogOut();
  const { data } = useWorkspaceShell(workspaceId);
  const [leaveTarget, setLeaveTarget] = useState<WorkspaceSummary | null>(null);

  const rows = (data?.workspaces ?? []).map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    initials: toInitials(workspace.name),
    hint: t('profile.workspaces.hint', {
      role: tCommon(`roles.name.${workspace.role}`),
      count: workspace.memberCount,
    }),
    isCurrent: workspace.id === workspaceId,
    canLeave: can(workspace.role, PermissionResource.WorkspaceSettings, PermissionAction.Leave),
  }));

  return (
    <>
      <WorkspaceList
        title={t('profile.workspaces.title')}
        currentLabel={t('profile.workspaces.current')}
        leaveLabel={t('profile.workspaces.leave')}
        logOutLabel={t('profile.workspaces.logOut')}
        rows={rows}
        onLeave={(id) =>
          setLeaveTarget(data?.workspaces.find((workspace) => workspace.id === id) ?? null)
        }
        onLogOut={() => void logOut()}
      />
      <LeaveWorkspaceDialog
        workspaceId={leaveTarget?.id ?? ''}
        workspaceName={leaveTarget?.name ?? ''}
        open={leaveTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLeaveTarget(null);
          }
        }}
      />
    </>
  );
}
