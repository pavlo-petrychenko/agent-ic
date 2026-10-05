import clsx from 'clsx';
import { type MouseEvent, useId, useState } from 'react';
import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from 'recharts';
import { ChartPlaceholder, ChartPlaceholderKind } from '@/shared/ui/charts/BarChart';
import {
  CHART_OPTION_ID_SUFFIX,
  CHART_TOOLTIP_ID_SUFFIX,
  useChartHighlight,
  useMeasuredWidth,
} from '@/shared/ui/charts/ChartTooltip';
import {
  LINE_CHART_CATEGORY_KEY,
  LINE_CHART_DEFAULT_HEIGHT,
  LINE_CHART_FALLBACK_WIDTH,
  LINE_CHART_MARGIN,
  LINE_CHART_STROKE_WIDTH,
  LINE_CHART_SUMMARY_JOINER,
  LINE_CHART_SUMMARY_SEPARATOR,
  LINE_CHART_TICK_MARGIN,
  LINE_CHART_X_AXIS_HEIGHT,
  LINE_CHART_Y_AXIS_WIDTH,
  LineChartLegend,
} from '@/shared/ui/charts/LineChart/LineChart.constants';
import type {
  LineChartProps,
  LineRow,
  LineSeries,
} from '@/shared/ui/charts/LineChart/LineChart.typedefs';
import { LineHighlight } from '@/shared/ui/charts/LineChart/LineHighlight';
import { Legend, type LegendItem, LegendMarkerKind } from '@/shared/ui/display/Legend';
import styles from '@/shared/ui/charts/LineChart/LineChart.module.scss';

const toRows = (series: readonly LineSeries[]): LineRow[] => {
  const order: string[] = [];
  const values = new Map<string, Record<string, number | null>>();
  for (const line of series) {
    for (const point of line.points) {
      const row = values.get(point.x) ?? {};
      if (!values.has(point.x)) {
        order.push(point.x);
        values.set(point.x, row);
      }
      row[line.id] = point.y;
    }
  }
  return order.map((x) => ({ x, values: values.get(x) ?? {} }));
};

const toLegendItems = (series: readonly LineSeries[]): LegendItem[] =>
  series.map((line) => ({
    id: line.id,
    label: line.label,
    marker: { kind: LegendMarkerKind.Series, color: line.color },
  }));

const hasValues = (rows: readonly LineRow[]): boolean =>
  rows.some((row) => Object.values(row.values).some((value) => value !== null));

const identity = (x: string) => x;

export function LineChart({
  series,
  ariaLabel,
  formatValue,
  formatTitle = null,
  formatY = null,
  yTicks = null,
  yDomain = null,
  showEndMarker = false,
  legend = LineChartLegend.None,
  legendLabel = null,
  hiddenSeriesIds = null,
  onToggleSeries = null,
  height = LINE_CHART_DEFAULT_HEIGHT,
  onHighlight = null,
  loading = false,
  loadingLabel = null,
  empty = null,
  className,
}: LineChartProps) {
  const id = useId();
  const tooltipId = `${id}${CHART_TOOLTIP_ID_SUFFIX}`;
  const optionId = (index: number) => `${id}${CHART_OPTION_ID_SUFFIX}${index}`;
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const width = useMeasuredWidth(frame, LINE_CHART_FALLBACK_WIDTH);
  const rows = toRows(series);
  const highlight = useChartHighlight({ count: rows.length, onHighlight });
  const hidden = new Set(hiddenSeriesIds ?? []);
  const visible = series.filter((line) => !hidden.has(line.id));
  const title = formatTitle ?? identity;

  const legendRow =
    legend === LineChartLegend.Top ? (
      <Legend
        items={toLegendItems(series)}
        hiddenIds={hiddenSeriesIds}
        onToggle={onToggleSeries}
        ariaLabel={legendLabel}
      />
    ) : null;

  if (loading) {
    return (
      <div className={clsx(styles.root, className)}>
        {legendRow}
        <ChartPlaceholder
          kind={ChartPlaceholderKind.Loading}
          label={loadingLabel}
          height={height}
        />
      </div>
    );
  }

  if (!hasValues(rows)) {
    return (
      <div className={clsx(styles.root, className)}>
        <ChartPlaceholder kind={ChartPlaceholderKind.Empty} text={empty} height={height} />
      </div>
    );
  }

  const plotLeft = LINE_CHART_MARGIN.left + LINE_CHART_Y_AXIS_WIDTH;
  const plotWidth = width - plotLeft - LINE_CHART_MARGIN.right;

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const offset = event.clientX - event.currentTarget.getBoundingClientRect().left - plotLeft;
    const last = rows.length - 1;
    const step = last > 0 ? plotWidth / last : plotWidth;
    if (step <= 0 || offset < -step / 2) {
      highlight.setIndex(null);
      return;
    }
    highlight.setIndex(Math.min(Math.round(offset / step), last));
  };

  return (
    <div className={clsx(styles.root, className)}>
      {legendRow}
      <div
        ref={setFrame}
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="listbox"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-activedescendant={highlight.index === null ? undefined : optionId(highlight.index)}
        className={styles.frame}
        onKeyDown={highlight.onKeyDown}
        onBlur={() => highlight.setIndex(null)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => highlight.setIndex(null)}
      >
        <div ref={setHost} aria-hidden="true" className={styles.plot} style={{ height }}>
          <RechartsLineChart
            width={width}
            height={height}
            data={rows}
            margin={LINE_CHART_MARGIN}
            accessibilityLayer={false}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={LINE_CHART_CATEGORY_KEY}
              axisLine={false}
              tickLine={false}
              interval={0}
              height={LINE_CHART_X_AXIS_HEIGHT}
            />
            <YAxis
              width={LINE_CHART_Y_AXIS_WIDTH}
              axisLine={false}
              tickLine={false}
              tickMargin={LINE_CHART_TICK_MARGIN}
              ticks={yTicks === null ? undefined : [...yTicks]}
              domain={yDomain === null ? undefined : [yDomain[0], yDomain[1]]}
              tickFormatter={formatY ?? undefined}
            />
            {visible.map((line) => (
              <Line
                key={line.id}
                name={line.label}
                type="linear"
                dataKey={(row: LineRow) => row.values[line.id] ?? null}
                strokeWidth={LINE_CHART_STROKE_WIDTH}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                data-series={line.id}
                className={clsx(styles.line, styles[line.color])}
              />
            ))}
            <LineHighlight
              rows={rows}
              series={visible}
              index={highlight.index}
              showEndMarker={showEndMarker}
              tooltip={
                host === null
                  ? null
                  : {
                      host,
                      id: tooltipId,
                      bounds: { width, height },
                      formatTitle: title,
                      formatValue,
                    }
              }
            />
          </RechartsLineChart>
        </div>
        {rows.map((row, index) => (
          <div
            key={optionId(index)}
            id={optionId(index)}
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="option"
            aria-selected={highlight.index === index}
            className={styles.visuallyHidden}
          >
            {title(row.x)}
            {LINE_CHART_SUMMARY_SEPARATOR}
            {visible
              .flatMap((line) => {
                const value = row.values[line.id] ?? null;
                return value === null ? [] : [`${line.label} ${formatValue(value, line)}`];
              })
              .join(LINE_CHART_SUMMARY_JOINER)}
          </div>
        ))}
      </div>
    </div>
  );
}
