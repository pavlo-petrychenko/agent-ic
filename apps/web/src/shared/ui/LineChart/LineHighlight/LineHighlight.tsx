import clsx from 'clsx';
import { createPortal } from 'react-dom';
import {
  DefaultZIndexes,
  type ScaleFunction,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
  ZIndexLayer,
} from 'recharts';
import { ChartTooltip, ChartTooltipPlacement } from '@/shared/ui/ChartTooltip';
import {
  LINE_CHART_MARKER_RADIUS,
  LINE_CHART_MARKER_STROKE_WIDTH,
} from '@/shared/ui/LineChart/LineChart.constants';
import type { LineRow, LineSeries } from '@/shared/ui/LineChart/LineChart.typedefs';
import { LINE_HIGHLIGHT_CROSSHAIR_DASH } from '@/shared/ui/LineChart/LineHighlight/LineHighlight.constants';
import type {
  LineHighlightProps,
  LineMarker,
} from '@/shared/ui/LineChart/LineHighlight/LineHighlight.typedefs';
import styles from '@/shared/ui/LineChart/LineHighlight/LineHighlight.module.scss';

const markerAt = (
  row: LineRow | undefined,
  line: LineSeries,
  xScale: ScaleFunction,
  yScale: ScaleFunction,
): LineMarker | null => {
  const value = row?.values[line.id] ?? null;
  if (row === undefined || value === null) {
    return null;
  }
  const cx = xScale(row.x);
  const cy = yScale(value);
  return cx === undefined || cy === undefined ? null : { id: line.id, color: line.color, cx, cy };
};

const lastRowIndex = (rows: readonly LineRow[], line: LineSeries): number =>
  rows.findLastIndex((row) => (row.values[line.id] ?? null) !== null);

export function LineHighlight({ rows, series, index, showEndMarker, tooltip }: LineHighlightProps) {
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const plot = usePlotArea();

  if (xScale === undefined || yScale === undefined || plot === undefined) {
    return null;
  }

  const row = index === null ? undefined : rows[index];
  const markers = (
    row === undefined
      ? showEndMarker
        ? series.map((line) => markerAt(rows[lastRowIndex(rows, line)], line, xScale, yScale))
        : []
      : series.map((line) => markerAt(row, line, xScale, yScale))
  ).filter((marker) => marker !== null);
  const crosshairX = row === undefined ? undefined : xScale(row.x);

  return (
    <>
      {crosshairX !== undefined && (
        <ZIndexLayer zIndex={DefaultZIndexes.cursorLine}>
          <line
            x1={crosshairX}
            x2={crosshairX}
            y1={plot.y}
            y2={plot.y + plot.height}
            strokeDasharray={LINE_HIGHLIGHT_CROSSHAIR_DASH}
            className={styles.crosshair}
          />
        </ZIndexLayer>
      )}
      <ZIndexLayer zIndex={DefaultZIndexes.activeDot}>
        {markers.map((marker) => (
          <circle
            key={marker.id}
            data-series={marker.id}
            cx={marker.cx}
            cy={marker.cy}
            r={LINE_CHART_MARKER_RADIUS}
            strokeWidth={LINE_CHART_MARKER_STROKE_WIDTH}
            className={clsx(styles.marker, styles[marker.color])}
          />
        ))}
      </ZIndexLayer>
      {row !== undefined &&
        crosshairX !== undefined &&
        tooltip !== null &&
        createPortal(
          <ChartTooltip
            id={tooltip.id}
            title={tooltip.formatTitle(row.x)}
            rows={series.flatMap((line) => {
              const value = row.values[line.id] ?? null;
              return value === null
                ? []
                : [
                    {
                      id: line.id,
                      label: line.label,
                      value: tooltip.formatValue(value, line),
                      color: line.color,
                    },
                  ];
            })}
            anchor={{ x: crosshairX, y: plot.y }}
            placement={ChartTooltipPlacement.Right}
            bounds={tooltip.bounds}
          />,
          tooltip.host,
        )}
    </>
  );
}
