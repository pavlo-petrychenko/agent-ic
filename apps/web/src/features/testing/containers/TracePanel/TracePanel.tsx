import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { NODE_PRESENTATION } from '@/features/flow-builder';
import { useTestingRun } from '@/features/testing/communication/hooks/useTestingRun';
import { BUILDER_PATH } from '@/features/testing/constants/testing.constants';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import { TRACE_LEGEND } from '@/features/testing/containers/TracePanel/TracePanel.constants';
import type { TracePanelProps } from '@/features/testing/containers/TracePanel/TracePanel.typedefs';
import { isActiveRun } from '@/features/testing/logic/helpers/chat.helpers';
import {
  focusNodeId,
  layoutTrace,
  nodeState,
} from '@/features/testing/logic/helpers/trace.helpers';
import { RunTrace } from '@/features/testing/view/RunTrace';
import { TextLink } from '@/shared/ui/actions/TextLink';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { Legend, LegendMarkerKind } from '@/shared/ui/display/Legend';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/testing/containers/TracePanel/TracePanel.module.scss';

export function TracePanel({ workspaceId, agentId, flow, run, turnNumber }: TracePanelProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);
  const details = useTestingRun(run?.id ?? null, run?.status ?? null);
  const slots = useMemo(() => (flow === null ? [] : layoutTrace(flow)), [flow]);
  const active = run !== null && isActiveRun(run);
  const steps = details.run?.steps ?? [];
  const cells = slots.map((slot) => ({
    ...slot,
    ...NODE_PRESENTATION[slot.type],
    state: nodeState(steps, slot.id, active),
  }));
  const node = focusNodeId(details.run);

  return (
    <>
      <section className={styles.root} aria-label={t('trace.label')}>
        <p className={styles.title}>
          {turnNumber === null ? t('trace.idle') : t('trace.title', { number: turnNumber })}
        </p>
        <div className={styles.graph}>
          {flow === null || details.failed ? (
            <EmptyState
              icon={IconName.Alert}
              tone={EmptyStateTone.Err}
              title={details.failed ? t('trace.loadError') : t('trace.noFlow')}
            />
          ) : (
            <RunTrace cells={cells} />
          )}
        </div>
        <div className={styles.footer}>
          <Legend
            ariaLabel={t('trace.legend')}
            items={TRACE_LEGEND.map(({ state, status }) => ({
              id: state,
              label: t(`trace.state.${state}`),
              marker: { kind: LegendMarkerKind.Status, status },
            }))}
          />
          <TextLink to={BUILDER_PATH} params={{ workspaceId, agentId }} search={{ node }}>
            {t('trace.openInBuilder')}
          </TextLink>
        </div>
      </section>
      <aside className={styles.details} aria-label={t('details.label')}>
        <p className={styles.note}>{t('note')}</p>
      </aside>
    </>
  );
}
