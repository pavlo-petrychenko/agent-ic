import clsx from 'clsx';
import { useState } from 'react';
import { ChartTooltip, ChartTooltipPlacement } from '@/shared/ui/charts/ChartTooltip';
import type {
  BarGeometry,
  TimelineRowProps,
} from '@/shared/ui/runs/TimelineWaterfall/TimelineRow/TimelineRow.typedefs';
import {
  LabelSide,
  TIMELINE_BAR_HEIGHT,
  TIMELINE_BAR_RADIUS,
  TIMELINE_BAR_TOP,
  TIMELINE_DEPTH_INDENT,
  TIMELINE_LABEL_CHARACTER_WIDTH,
  TIMELINE_LABEL_GAP,
  TIMELINE_MIN_BAR_WIDTH,
  TIMELINE_TEXT_ANCHORS,
  TIMELINE_TEXT_BASELINE,
  TIMELINE_TOOLTIP_ROW_ID,
  TIMELINE_TRACK_HEIGHT,
} from '@/shared/ui/runs/TimelineWaterfall/TimelineWaterfall.constants';
import type { TimelineRowData } from '@/shared/ui/runs/TimelineWaterfall/TimelineWaterfall.typedefs';
import styles from '@/shared/ui/runs/TimelineWaterfall/TimelineRow/TimelineRow.module.scss';

const getBarGeometry = (row: TimelineRowData, totalMs: number, trackWidth: number): BarGeometry => {
  const scale = totalMs > 0 ? trackWidth / totalMs : 0;
  const width = Math.max(row.durationMs * scale, TIMELINE_MIN_BAR_WIDTH);
  const x = Math.min(Math.max(row.startMs * scale, 0), Math.max(trackWidth - width, 0));
  const labelWidth = row.durationLabel.length * TIMELINE_LABEL_CHARACTER_WIDTH;
  const fitsAfter = x + width + TIMELINE_LABEL_GAP + labelWidth <= trackWidth;
  return fitsAfter
    ? { x, width, labelX: x + width + TIMELINE_LABEL_GAP, labelSide: LabelSide.After }
    : { x, width, labelX: x - TIMELINE_LABEL_GAP, labelSide: LabelSide.Before };
};

export function TimelineRow({
  row,
  totalMs,
  trackWidth,
  labelWidth,
  selected,
  onSelect,
}: TimelineRowProps) {
  const [active, setActive] = useState(false);
  const bar = getBarGeometry(row, totalMs, trackWidth);
  const barCentre = bar.x + bar.width / 2;

  return (
    <li className={clsx(styles.root, selected && styles.selected)}>
      <button
        type="button"
        aria-label={row.description}
        aria-current={selected ? 'true' : undefined}
        className={styles.hit}
        onClick={() => onSelect(row.id)}
        onPointerEnter={() => setActive(true)}
        onPointerLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
      />
      <span
        aria-hidden="true"
        className={styles.label}
        style={{ width: labelWidth, paddingLeft: row.depth * TIMELINE_DEPTH_INDENT }}
      >
        <span className={styles.labelText}>{row.label}</span>
      </span>
      <div aria-hidden="true" className={styles.track}>
        <svg width={trackWidth} height={TIMELINE_TRACK_HEIGHT} className={styles.chart}>
          <rect
            x={bar.x}
            y={TIMELINE_BAR_TOP}
            width={bar.width}
            height={TIMELINE_BAR_HEIGHT}
            rx={TIMELINE_BAR_RADIUS}
            data-kind={row.kind}
            className={clsx(styles.bar, styles[row.kind])}
          />
          <text
            x={bar.labelX}
            y={TIMELINE_TRACK_HEIGHT / 2}
            textAnchor={TIMELINE_TEXT_ANCHORS[bar.labelSide]}
            dominantBaseline={TIMELINE_TEXT_BASELINE}
            className={styles.value}
          >
            {row.durationLabel}
          </text>
        </svg>
        <ChartTooltip
          title={row.label}
          rows={[
            {
              id: TIMELINE_TOOLTIP_ROW_ID,
              label: null,
              value: row.durationLabel,
              color: null,
            },
          ]}
          anchor={{ x: barCentre, y: TIMELINE_BAR_TOP }}
          placement={ChartTooltipPlacement.Above}
          bounds={{ width: trackWidth, height: TIMELINE_TRACK_HEIGHT }}
          visible={active}
        />
      </div>
    </li>
  );
}
