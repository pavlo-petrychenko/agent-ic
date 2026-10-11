import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRestoreVersion } from '@/features/testing/communication/hooks/useRestoreVersion';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import type { RestoreVersionDialogProps } from '@/features/testing/containers/RestoreVersionDialog/RestoreVersionDialog.typedefs';
import { formatVersionDate } from '@/features/testing/logic/helpers/versions.helpers';
import { RestoreModal } from '@/features/testing/view/RestoreModal';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { useLocale } from '@/shared/i18n/hooks/useLocale';

export function RestoreVersionDialog({
  agentName,
  version,
  draft,
  liveNumber,
  onRestored,
  onClose,
}: RestoreVersionDialogProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);
  const { locale } = useLocale();
  const errorMessage = useErrorMessage();
  const { restore, restoring } = useRestoreVersion();
  const [error, setError] = useState<string | null>(null);

  const onRestore = async () => {
    setError(null);
    try {
      await restore(version.id, draft.revision);
      onRestored();
    } catch (failure) {
      setError(errorMessage(toAppError(failure)));
    }
  };

  return (
    <RestoreModal
      number={version.number}
      subtitle={
        version.publishedAt === null
          ? agentName
          : t('versions.restore.subtitle', {
              name: agentName,
              date: formatVersionDate(version.publishedAt, locale),
            })
      }
      liveNumber={liveNumber}
      draftNumber={draft.number}
      changeCount={draft.changeCount}
      restoring={restoring}
      error={error}
      onRestore={() => void onRestore()}
      onClose={onClose}
    />
  );
}
