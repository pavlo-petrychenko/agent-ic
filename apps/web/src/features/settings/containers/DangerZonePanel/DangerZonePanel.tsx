import { can, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { DangerZonePanelProps } from '@/features/settings/containers/DangerZonePanel/DangerZonePanel.typedefs';
import { LeaveWorkspaceDialog } from '@/features/settings/containers/LeaveWorkspaceDialog';
import { TransferOwnershipDialog } from '@/features/settings/containers/TransferOwnershipDialog';
import { DangerZoneCard } from '@/features/settings/view/DangerZoneCard';
import type { DangerZoneRow } from '@/features/settings/view/DangerZoneCard';
import { useActiveWorkspace } from '@/features/workspace';

export function DangerZonePanel({ workspaceId }: DangerZonePanelProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const active = useActiveWorkspace(workspaceId);
  const [transferOpen, setTransferOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const canTransfer =
    active !== null &&
    can(active.role, PermissionResource.WorkspaceSettings, PermissionAction.Transfer);

  const canLeave =
    active !== null &&
    can(active.role, PermissionResource.WorkspaceSettings, PermissionAction.Leave);

  const workspaceName = active?.name ?? '';
  const leaveDescription = canLeave
    ? t('general.danger.leave.description')
    : t('general.danger.leave.noAccessDescription');
  const transferDescription = canTransfer
    ? t('general.danger.transfer.description')
    : t('general.danger.transfer.noAccessDescription');

  const rows: readonly DangerZoneRow[] = [
    {
      id: 'transfer',
      title: t('general.danger.transfer.title'),
      description: transferDescription,
      actionLabel: t('general.danger.transfer.action'),
      disabled: !canTransfer,
      onAction: () => setTransferOpen(true),
    },
    {
      id: 'leave',
      title: t('general.danger.leave.title', { workspace: workspaceName }),
      description: leaveDescription,
      actionLabel: t('general.danger.leave.action'),
      disabled: !canLeave,
      onAction: () => setLeaveOpen(true),
    },
  ].filter(Boolean) as DangerZoneRow[];

  return (
    <>
      <DangerZoneCard title={t('general.danger.title')} rows={rows} />
      <TransferOwnershipDialog
        workspaceName={workspaceName}
        open={transferOpen}
        onOpenChange={setTransferOpen}
      />
      <LeaveWorkspaceDialog
        workspaceId={active?.id ?? ''}
        workspaceName={workspaceName}
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
      />
    </>
  );
}
