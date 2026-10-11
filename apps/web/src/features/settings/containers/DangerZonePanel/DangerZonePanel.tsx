import { can, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { DangerZonePanelProps } from '@/features/settings/containers/DangerZonePanel/DangerZonePanel.typedefs';
import { TransferOwnershipDialog } from '@/features/settings/containers/TransferOwnershipDialog';
import { DangerZoneCard } from '@/features/settings/view/DangerZoneCard';
import type { DangerZoneRow } from '@/features/settings/view/DangerZoneCard';
import { useActiveWorkspace } from '@/features/workspace';

export function DangerZonePanel({ workspaceId }: DangerZonePanelProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const active = useActiveWorkspace(workspaceId);
  const [transferOpen, setTransferOpen] = useState(false);
  const canTransfer =
    active !== null &&
    can(active.role, PermissionResource.WorkspaceSettings, PermissionAction.Transfer);

  const rows: readonly DangerZoneRow[] = canTransfer
    ? [
        {
          id: 'transfer',
          title: t('general.danger.transfer.title'),
          description: t('general.danger.transfer.description'),
          actionLabel: t('general.danger.transfer.action'),
          onAction: () => setTransferOpen(true),
        },
      ]
    : [];

  return (
    <>
      <DangerZoneCard title={t('general.danger.title')} rows={rows} />
      {canTransfer && (
        <TransferOwnershipDialog
          workspaceName={active?.name ?? ''}
          open={transferOpen}
          onOpenChange={setTransferOpen}
        />
      )}
    </>
  );
}
