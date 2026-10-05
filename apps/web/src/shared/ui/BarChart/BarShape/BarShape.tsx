import clsx from 'clsx';
import { createPortal } from 'react-dom';
import { Rectangle } from 'recharts';
import { BAR_CHART_BAR_RADIUS } from '@/shared/ui/BarChart/BarChart.constants';
import type { BarShapeProps } from '@/shared/ui/BarChart/BarShape/BarShape.typedefs';
import { ChartTooltip, ChartTooltipPlacement } from '@/shared/ui/ChartTooltip';
import styles from '@/shared/ui/BarChart/BarShape/BarShape.module.scss';

export function BarShape({ x, y, width, height, tone, tooltip }: BarShapeProps) {
  return (
    <>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        radius={BAR_CHART_BAR_RADIUS}
        data-tone={tone}
        className={clsx(styles.bar, styles[tone])}
      />
      {tooltip !== null &&
        createPortal(
          <ChartTooltip
            id={tooltip.id}
            title={tooltip.title}
            rows={tooltip.rows}
            anchor={{ x: x + width / 2, y }}
            placement={ChartTooltipPlacement.Above}
            bounds={tooltip.bounds}
          />,
          tooltip.host,
        )}
    </>
  );
}
