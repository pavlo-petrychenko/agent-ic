import { can, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { DangerZonePanelProps } from '@/features/settings/containers/DangerZonePanel/DangerZonePanel.typedefs';
import { DeleteWorkspaceDialog } from '@/features/settings/containers/DeleteWorkspaceDialog';
import { LeaveWorkspaceDialog } from '@/features/settings/containers/LeaveWorkspaceDialog';
import { TransferOwnershipDialog } from '@/features/settings/containers/TransferOwnershipDialog';
import { DangerActionTone, DangerZoneCard } from '@/features/settings/view/DangerZoneCard';
import type { DangerZoneRow } from '@/features/settings/view/DangerZoneCard';
import { useActiveWorkspace } from '@/features/workspace';

export function DangerZonePanel({ workspaceId }: DangerZonePanelProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const active = useActiveWorkspace(workspaceId);
  const [transferOpen, setTransferOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canTransfer =
    active !== null &&
    can(active.role, PermissionResource.WorkspaceSettings, PermissionAction.Transfer);
  const canLeave =
    active !== null &&
    can(active.role, PermissionResource.WorkspaceSettings, PermissionAction.Leave);
  const canDelete =
    active !== null &&
    can(active.role, PermissionResource.WorkspaceSettings, PermissionAction.Delete);

  const workspaceName = active?.name ?? '';
  const rows: readonly DangerZoneRow[] = [
    canTransfer && {
      id: 'transfer',
      title: t('general.danger.transfer.title'),
      description: t('general.danger.transfer.description'),
      actionLabel: t('general.danger.transfer.action'),
      onAction: () => setTransferOpen(true),
    },
    {
      id: 'leave',
      title: t('general.danger.leave.title', { workspace: workspaceName }),
      description: canLeave
        ? t('general.danger.leave.description')
        : t('general.danger.leave.noAccessDescription'),
      actionLabel: t('general.danger.leave.action'),
      disabled: !canLeave,
      onAction: () => setLeaveOpen(true),
    },
    canDelete && {
      id: 'delete',
      title: t('general.danger.delete.title'),
      description: t('general.danger.delete.description'),
      actionLabel: t('general.danger.delete.action'),
      tone: DangerActionTone.Danger,
      onAction: () => setDeleteOpen(true),
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
      <DeleteWorkspaceDialog
        workspaceName={workspaceName}
        memberCount={active?.memberCount ?? 0}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
