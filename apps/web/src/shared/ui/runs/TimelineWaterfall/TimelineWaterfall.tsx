import clsx from 'clsx';
import { useState } from 'react';
import { useMeasuredWidth } from '@/shared/ui/charts/ChartTooltip';
import { Legend, LegendMarkerKind } from '@/shared/ui/display/Legend';
import type { LegendItem } from '@/shared/ui/display/Legend';
import { TimelineRow } from '@/shared/ui/runs/TimelineWaterfall/TimelineRow';
import {
  TIMELINE_DEFAULT_LABEL_WIDTH,
  TIMELINE_FALLBACK_TRACK_WIDTH,
  TIMELINE_PERCENT,
} from '@/shared/ui/runs/TimelineWaterfall/TimelineWaterfall.constants';
import type { TimelineWaterfallProps } from '@/shared/ui/runs/TimelineWaterfall/TimelineWaterfall.typedefs';
import { TRACE_STEP_NODE_KINDS, TraceStepKind } from '@/shared/ui/runs/TraceRow/TraceRow.constants';
import styles from '@/shared/ui/runs/TimelineWaterfall/TimelineWaterfall.module.scss';

export function TimelineWaterfall({
  rows,
  totalMs,
  ticks,
  ariaLabel,
  legendLabels,
  legendAriaLabel,
  selectedId = null,
  onSelect,
  caption = null,
  labelWidth = TIMELINE_DEFAULT_LABEL_WIDTH,
  className,
}: TimelineWaterfallProps) {
  const [axisTrack, setAxisTrack] = useState<HTMLDivElement | null>(null);
  const trackWidth = useMeasuredWidth(axisTrack, TIMELINE_FALLBACK_TRACK_WIDTH);
  const usedKinds = new Set(rows.map((row) => row.kind));
  const legendItems: LegendItem[] = Object.values(TraceStepKind)
    .filter((kind) => usedKinds.has(kind))
    .map((kind) => ({
      id: kind,
      label: legendLabels[kind],
      marker: { kind: LegendMarkerKind.Hue, hue: TRACE_STEP_NODE_KINDS[kind] },
    }));

  return (
    <div className={clsx(styles.root, className)}>
      {caption !== null && <p className={styles.caption}>{caption}</p>}
      <div aria-hidden="true" className={styles.axis}>
        <span className={styles.axisLabel} style={{ width: labelWidth }} />
        <div ref={setAxisTrack} className={styles.axisTrack}>
          {ticks.map((tick) => {
            const percent = totalMs > 0 ? (tick.valueMs / totalMs) * TIMELINE_PERCENT : 0;
            return (
              <span
                key={tick.valueMs}
                className={styles.tick}
                style={{ left: `${percent}%`, transform: `translateX(-${percent}%)` }}
              >
                {tick.label}
              </span>
            );
          })}
        </div>
      </div>
      <ul aria-label={ariaLabel} className={styles.rows}>
        {rows.map((row) => (
          <TimelineRow
            key={row.id}
            row={row}
            totalMs={totalMs}
            trackWidth={trackWidth}
            labelWidth={labelWidth}
            selected={row.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </ul>
      {legendItems.length > 0 && (
        <div className={styles.legend}>
          <Legend items={legendItems} ariaLabel={legendAriaLabel} />
        </div>
      )}
    </div>
  );
}
