import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRestoreDraftVersion } from '@/features/flow-builder/communication/hooks/useRestoreDraftVersion';
import { useRollbackAgent } from '@/features/flow-builder/communication/hooks/useRollbackAgent';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { SaveState } from '@/features/flow-builder/constants/saveState.constants';
import { VersionAction } from '@/features/flow-builder/constants/versions.constants';
import type { VersionActionDialogProps } from '@/features/flow-builder/containers/VersionActionDialog/VersionActionDialog.typedefs';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import { VersionActionModal } from '@/features/flow-builder/view/VersionActionModal';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';

export function VersionActionDialog({
  action,
  version,
  liveNumber,
  nextNumber,
  changeCount,
  onDone,
  onClose,
}: VersionActionDialogProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const errorMessage = useErrorMessage();
  const revision = useFlowBuilderStore((state) => state.revision);
  const saveState = useFlowBuilderStore((state) => state.saveState);
  const { rollback, rollingBack } = useRollbackAgent();
  const { restore, restoring } = useRestoreDraftVersion();
  const [note, setNote] = useState(() =>
    t('versions.rollback.defaultNote', { number: version.number }),
  );
  const [error, setError] = useState<string | null>(null);
  const blockedReason =
    saveState === SaveState.Conflict
      ? t('publish.blocked.conflict')
      : saveState === SaveState.Error
        ? t('publish.blocked.saveFailed')
        : saveState === SaveState.Idle
          ? null
          : t('publish.blocked.unsaved');

  const onConfirm = async () => {
    setError(null);
    try {
      if (action === VersionAction.Rollback) {
        onDone(action, await rollback(version.id, revision, note));
      } else {
        await restore(version.id, revision);
        onDone(action, version.number);
      }
    } catch (failure) {
      setError(errorMessage(toAppError(failure)));
    }
  };

  return (
    <VersionActionModal
      action={action}
      number={version.number}
      liveNumber={liveNumber}
      nextNumber={nextNumber}
      changeCount={changeCount}
      note={note}
      blockedReason={blockedReason}
      busy={rollingBack || restoring}
      error={error}
      onNoteChange={setNote}
      onConfirm={() => void onConfirm()}
      onClose={onClose}
    />
  );
}
