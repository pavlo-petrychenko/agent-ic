import { useTranslation } from 'react-i18next';
import { useChangeTexts } from '@/features/flow-builder';
import { useVersionDiff } from '@/features/testing/communication/hooks/useVersionDiff';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import { EMPTY_DOCUMENT } from '@/features/testing/constants/versions.constants';
import type { VersionComparePanelProps } from '@/features/testing/containers/VersionComparePanel/VersionComparePanel.typedefs';
import { previousVersion } from '@/features/testing/logic/helpers/versions.helpers';
import { VersionChanges } from '@/features/testing/view/VersionChanges';

export function VersionComparePanel({
  agentId,
  draft,
  published,
  selectedId,
}: VersionComparePanelProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);
  const version = published.find((entry) => entry.id === selectedId) ?? null;
  const previous = previousVersion(published, version?.number ?? null);
  const { diff, loading, failed, retry } = useVersionDiff(
    agentId,
    previous?.id ?? null,
    previous === null ? null : selectedId,
  );
  const changes = useChangeTexts(
    diff,
    (version === null ? draft.flow : version.flow) ?? EMPTY_DOCUMENT,
  );
  const number = version?.number ?? draft.number;

  return (
    <VersionChanges
      title={
        version === null
          ? t('versions.compare.draftTitle', { number })
          : t('versions.compare.title', { number })
      }
      subtitle={
        previous === null ? null : t('versions.compare.subtitle', { number: previous.number })
      }
      changes={changes}
      emptyText={
        previous === null
          ? t('versions.compare.first', { number })
          : t('versions.compare.noChanges')
      }
      loading={loading}
      failed={failed}
      onRetry={retry}
    />
  );
}
