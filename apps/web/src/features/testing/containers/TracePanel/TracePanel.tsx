import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { NODE_PRESENTATION } from '@/features/flow-builder';
import { useTestingRun } from '@/features/testing/communication/hooks/useTestingRun';
import { BUILDER_PATH } from '@/features/testing/constants/testing.constants';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import {
  EMPTY_FIELD_VALUE,
  RUN_STATUS_TONES,
  STEP_STATUS_TONES,
} from '@/features/testing/constants/trace.constants';
import { TRACE_LEGEND } from '@/features/testing/containers/TracePanel/TracePanel.constants';
import type { TracePanelProps } from '@/features/testing/containers/TracePanel/TracePanel.typedefs';
import { isActiveRun } from '@/features/testing/logic/helpers/chat.helpers';
import {
  formatSeconds,
  inspectStep,
  toStepView,
} from '@/features/testing/logic/helpers/output.helpers';
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
  selectedNodeId,
  onSelectNode,
}: TracePanelProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);
  const { locale } = useLocale();
  const details = useTestingRun(run?.id ?? null, run?.status ?? null);
  const slots = useMemo(() => (flow === null ? [] : layoutTrace(flow)), [flow]);
  const edges = useMemo(() => (flow === null ? [] : traceEdges(flow.edges, slots)), [flow, slots]);
  const active = run !== null && isActiveRun(run);
  const steps = details.run?.steps ?? [];
  const inspected = steps.findLast((step) => step.nodeId === selectedNodeId) ?? null;
  const cells = slots.map((slot) => ({
    ...slot,
    ...NODE_PRESENTATION[slot.type],
    state: nodeState(steps, slot.id, active),
    selectable: steps.some((step) => step.nodeId === slot.id),
    selected: slot.id === inspected?.nodeId,
  }));
  const node = inspected?.nodeId ?? focusNodeId(details.run);
  const slotById = new Map(slots.map((slot) => [slot.id, slot]));
  const turn = details.run;
  const inspectedSlot = inspected === null ? null : (slotById.get(inspected.nodeId) ?? null);
  const builderLink = (
    <TextLink to={BUILDER_PATH} params={{ workspaceId, agentId }} search={{ node }}>
      {t('trace.openInBuilder')}
    </TextLink>
  );
  const stepDetails =
    inspected === null || turnNumber === null ? null : (
      <TurnDetails
        back={{
          label: t('details.back', { number: turnNumber }),
          onBack: () => onSelectNode(null),
        }}
        title={inspectedSlot?.label ?? inspected.nodeId}
        statusLabel={t(`details.stepStatus.${inspected.status}`)}
        statusTone={STEP_STATUS_TONES[inspected.status]}
        metrics={[]}
        outputs={inspectStep(inspected, locale, inspectedSlot?.type ?? null).map(
          ({ section, view }) => ({ id: section, title: t(`details.${section}`), view }),
        )}
        action={builderLink}
      />
    );

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
            <RunTrace
              drawing={drawTrace(cells, edges)}
              onSelectNode={(id) => onSelectNode(id === selectedNodeId ? null : id)}
            />
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
          {builderLink}
        </div>
      </section>
      <aside className={styles.details} aria-label={t('details.label')}>
        {stepDetails !== null ? (
          stepDetails
        ) : turn === null || turnNumber === null ? (
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
              const slot = slotById.get(step.nodeId) ?? null;
              const view = toStepView(step, locale, slot?.type ?? null);
              return view === null
                ? []
                : [{ id: step.id, title: slot?.label ?? step.nodeId, view }];
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
