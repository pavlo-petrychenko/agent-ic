import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { NODE_PRESENTATION } from '@/features/flow-builder';
import { useTestingRun } from '@/features/testing/communication/hooks/useTestingRun';
import { BUILDER_PATH } from '@/features/testing/constants/testing.constants';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import { EMPTY_FIELD_VALUE, RUN_STATUS_TONES } from '@/features/testing/constants/trace.constants';
import { TRACE_LEGEND } from '@/features/testing/containers/TracePanel/TracePanel.constants';
import type { TracePanelProps } from '@/features/testing/containers/TracePanel/TracePanel.typedefs';
import { isActiveRun } from '@/features/testing/logic/helpers/chat.helpers';
import { formatSeconds, toOutputView } from '@/features/testing/logic/helpers/output.helpers';
import {
  drawTrace,
  focusNodeId,
  layoutTrace,
  nodeState,
  traceEdges,
} from '@/features/testing/logic/helpers/trace.helpers';
import { RunTrace } from '@/features/testing/view/RunTrace';
import { TurnDetails } from '@/features/testing/view/TurnDetails';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { TextLink } from '@/shared/ui/actions/TextLink';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { Legend, LegendMarkerKind } from '@/shared/ui/display/Legend';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/testing/containers/TracePanel/TracePanel.module.scss';

export function TracePanel({
  workspaceId,
  agentId,
  flow,
  run,
  turnNumber,
  draft,
  liveNumber,
}: TracePanelProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);
  const { locale } = useLocale();
  const details = useTestingRun(run?.id ?? null, run?.status ?? null);
  const slots = useMemo(() => (flow === null ? [] : layoutTrace(flow)), [flow]);
  const edges = useMemo(() => (flow === null ? [] : traceEdges(flow.edges, slots)), [flow, slots]);
  const active = run !== null && isActiveRun(run);
  const steps = details.run?.steps ?? [];
  const cells = slots.map((slot) => ({
    ...slot,
    ...NODE_PRESENTATION[slot.type],
    state: nodeState(steps, slot.id, active),
  }));
  const node = focusNodeId(details.run);
  const labels = new Map(slots.map((slot) => [slot.id, slot.label]));
  const turn = details.run;

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
            <RunTrace drawing={drawTrace(cells, edges)} />
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
        {turn === null || turnNumber === null ? (
          <div className={styles.empty}>
            <EmptyState icon={IconName.Flask} title={t('details.empty')} />
          </div>
        ) : (
          <TurnDetails
            title={t('details.title', { number: turnNumber })}
            statusLabel={t(`details.status.${turn.status}`)}
            statusTone={RUN_STATUS_TONES[turn.status]}
            metrics={[
              {
                label: t('details.duration'),
                value:
                  turn.durationMs === null
                    ? EMPTY_FIELD_VALUE
                    : t('details.seconds', { value: formatSeconds(turn.durationMs, locale) }),
              },
              {
                label: t('details.stepsRun'),
                value: t('details.stepsValue', {
                  run: turn.totals.stepsRun,
                  total: turn.totals.stepsInFlow,
                }),
              },
              { label: t('details.messagesSent'), value: String(turn.totals.messagesSent) },
            ]}
            outputs={turn.steps.flatMap((step) => {
              const view = toOutputView(step.output);
              return view === null
                ? []
                : [{ id: step.id, title: labels.get(step.nodeId) ?? step.nodeId, view }];
            })}
          />
        )}
        {draft && (
          <p className={styles.note}>
            {liveNumber === null ? t('note.noLive') : t('note.live', { number: liveNumber })}
          </p>
        )}
      </aside>
    </>
  );
}
