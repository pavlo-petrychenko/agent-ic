import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLastSimulationRun } from '@/features/flow-builder/communication/hooks/useLastSimulationRun';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { LAST_RUN_TONES, TESTING_PATH } from '@/features/flow-builder/constants/lastRun.constants';
import type { LastRunBarProps } from '@/features/flow-builder/containers/LastRunBar/LastRunBar.typedefs';
import { formatTimeAgo } from '@/features/flow-builder/logic/helpers/publish.helpers';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { StatusBar, StatusTone } from '@/shared/ui/layout/StatusBar';

export function LastRunBar({ workspaceId, agentId }: LastRunBarProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [now] = useState(Date.now);
  const revision = useFlowBuilderStore((state) => state.revision);
  const { run, loaded } = useLastSimulationRun(agentId);

  if (!loaded) {
    return null;
  }

  const detail = () => {
    if (run === null) {
      return t('lastRun.neverDetail');
    }
    const outcome = t(`lastRun.status.${run.status}`, {
      time: run.finishedAt === null ? '' : formatTimeAgo(run.finishedAt, now, locale),
    });
    if (run.draftRevision === null) {
      return t('lastRun.published', { outcome });
    }
    return run.draftRevision === revision ? outcome : t('lastRun.stale', { outcome });
  };

  return (
    <StatusBar
      tone={run === null ? StatusTone.Neutral : LAST_RUN_TONES[run.status]}
      label={run === null ? t('lastRun.never') : t('lastRun.label')}
      detail={detail()}
      action={{
        label: t('lastRun.open'),
        onClick: () =>
          void navigate({ to: TESTING_PATH, params: { workspaceId }, search: { agent: agentId } }),
      }}
    />
  );
}
