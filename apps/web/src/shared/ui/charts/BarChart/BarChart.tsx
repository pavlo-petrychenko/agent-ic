import clsx from 'clsx';
import { type MouseEvent, useId, useState } from 'react';
import {
  Bar,
  type BarShapeProps as RechartsBarShapeProps,
  CartesianGrid,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BAR_CHART_BAR_SIZE,
  BAR_CHART_CATEGORY_KEY,
  BAR_CHART_DEFAULT_HEIGHT,
  BAR_CHART_FALLBACK_WIDTH,
  BAR_CHART_MARGIN,
  BAR_CHART_SUMMARY_SEPARATOR,
  BAR_CHART_TICK_MARGIN,
  BAR_CHART_TOOLTIP_ROW_ID,
  BAR_CHART_VALUE_KEY,
  BAR_CHART_X_AXIS_HEIGHT,
  BAR_CHART_Y_AXIS_WIDTH,
  BarTone,
} from '@/shared/ui/charts/BarChart/BarChart.constants';
import type { BarChartProps } from '@/shared/ui/charts/BarChart/BarChart.typedefs';
import { BarShape } from '@/shared/ui/charts/BarChart/BarShape';
import {
  ChartPlaceholder,
  ChartPlaceholderKind,
} from '@/shared/ui/charts/BarChart/ChartPlaceholder';
import {
  CHART_OPTION_ID_SUFFIX,
  CHART_TOOLTIP_ID_SUFFIX,
  useChartHighlight,
  useMeasuredWidth,
} from '@/shared/ui/charts/ChartTooltip';
import styles from '@/shared/ui/charts/BarChart/BarChart.module.scss';

const toneFor = (index: number, highlighted: number | null): BarTone => {
  if (highlighted === null) {
    return BarTone.Rest;
  }
  return index === highlighted ? BarTone.Active : BarTone.Dimmed;
};

export function BarChart({
  data,
  ariaLabel,
  formatValue,
  formatY = null,
  yTicks = null,
  yDomain = null,
  height = BAR_CHART_DEFAULT_HEIGHT,
  onHighlight = null,
  loading = false,
  loadingLabel = null,
  empty = null,
  className,
}: BarChartProps) {
  const id = useId();
  const tooltipId = `${id}${CHART_TOOLTIP_ID_SUFFIX}`;
  const optionId = (index: number) => `${id}${CHART_OPTION_ID_SUFFIX}${index}`;
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const width = useMeasuredWidth(frame, BAR_CHART_FALLBACK_WIDTH);
  const highlight = useChartHighlight({ count: data.length, onHighlight });

  if (loading) {
    return (
      <ChartPlaceholder
        kind={ChartPlaceholderKind.Loading}
        label={loadingLabel}
        height={height}
        className={className}
      />
    );
  }

  if (data.length === 0) {
    return (
      <ChartPlaceholder
        kind={ChartPlaceholderKind.Empty}
        text={empty}
        height={height}
        className={className}
      />
    );
  }

  const plotLeft = BAR_CHART_MARGIN.left + BAR_CHART_Y_AXIS_WIDTH;
  const plotWidth = width - plotLeft - BAR_CHART_MARGIN.right;

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const offset = event.clientX - event.currentTarget.getBoundingClientRect().left - plotLeft;
    const band = plotWidth / data.length;
    highlight.setIndex(offset < 0 || band <= 0 ? null : Math.floor(offset / band));
  };

  const titleOf = (index: number) => {
    const datum = data[index];
    return datum === undefined ? '' : (datum.tooltipLabel ?? datum.category);
  };

  const renderBar = (props: RechartsBarShapeProps) => {
    const datum = data[props.index];
    const active = highlight.index === props.index && host !== null && datum !== undefined;
    return (
      <BarShape
        x={props.x}
        y={props.y}
        width={props.width}
        height={props.height}
        tone={toneFor(props.index, highlight.index)}
        tooltip={
          active
            ? {
                host,
                id: tooltipId,
                title: titleOf(props.index),
                rows: [
                  {
                    id: BAR_CHART_TOOLTIP_ROW_ID,
                    label: null,
                    value: formatValue(datum.value),
                    color: null,
                  },
                ],
                bounds: { width, height },
              }
            : null
        }
      />
    );
  };

  return (
    <div
      ref={setFrame}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="listbox"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-activedescendant={highlight.index === null ? undefined : optionId(highlight.index)}
      className={clsx(styles.root, className)}
      onKeyDown={highlight.onKeyDown}
      onBlur={() => highlight.setIndex(null)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => highlight.setIndex(null)}
    >
      <div ref={setHost} aria-hidden="true" className={styles.plot} style={{ height }}>
        <RechartsBarChart
          width={width}
          height={height}
          data={[...data]}
          margin={BAR_CHART_MARGIN}
          accessibilityLayer={false}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey={BAR_CHART_CATEGORY_KEY}
            axisLine={false}
            tickLine={false}
            interval={0}
            height={BAR_CHART_X_AXIS_HEIGHT}
          />
          <YAxis
            width={BAR_CHART_Y_AXIS_WIDTH}
            axisLine={false}
            tickLine={false}
            tickMargin={BAR_CHART_TICK_MARGIN}
            ticks={yTicks === null ? undefined : [...yTicks]}
            domain={yDomain === null ? undefined : [yDomain[0], yDomain[1]]}
            tickFormatter={formatY ?? undefined}
          />
          <Bar
            dataKey={BAR_CHART_VALUE_KEY}
            barSize={BAR_CHART_BAR_SIZE}
            isAnimationActive={false}
            shape={renderBar}
          />
        </RechartsBarChart>
      </div>
      {data.map((datum, index) => (
        <div
          key={optionId(index)}
          id={optionId(index)}
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
          role="option"
          aria-selected={highlight.index === index}
          className={styles.visuallyHidden}
        >
          {datum.tooltipLabel ?? datum.category}
          {BAR_CHART_SUMMARY_SEPARATOR}
          {formatValue(datum.value)}
        </div>
      ))}
    </div>
  );
}
