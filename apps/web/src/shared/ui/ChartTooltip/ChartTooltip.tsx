import clsx from 'clsx';
import { useLayoutEffect, useRef, useState } from 'react';
import {
  CHART_TOOLTIP_ABOVE_GAP,
  CHART_TOOLTIP_RIGHT_GAP,
  CHART_TOOLTIP_SEPARATOR,
  ChartTooltipPlacement,
} from '@/shared/ui/ChartTooltip/ChartTooltip.constants';
import type {
  ChartBounds,
  ChartPoint,
  ChartTooltipProps,
} from '@/shared/ui/ChartTooltip/ChartTooltip.typedefs';
import styles from '@/shared/ui/ChartTooltip/ChartTooltip.module.scss';

const EMPTY_SIZE: ChartBounds = { width: 0, height: 0 };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

const position = (
  anchor: ChartPoint,
  placement: ChartTooltipPlacement,
  size: ChartBounds,
  bounds: ChartBounds | null,
): ChartPoint => {
  if (placement === ChartTooltipPlacement.Above) {
    const centred = anchor.x - size.width / 2;
    const above = anchor.y - CHART_TOOLTIP_ABOVE_GAP - size.height;
    return {
      x: bounds === null ? centred : clamp(centred, 0, bounds.width - size.width),
      y: above < 0 ? anchor.y + CHART_TOOLTIP_ABOVE_GAP : above,
    };
  }
  const right = anchor.x + CHART_TOOLTIP_RIGHT_GAP;
  const flips = bounds !== null && right + size.width > bounds.width;
  return { x: flips ? anchor.x - CHART_TOOLTIP_RIGHT_GAP - size.width : right, y: anchor.y };
};

export function ChartTooltip({
  id,
  title,
  rows,
  anchor,
  placement,
  bounds = null,
  visible = true,
  className,
}: ChartTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ChartBounds>(EMPTY_SIZE);
  const inline = placement === ChartTooltipPlacement.Above;

  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null) {
      return;
    }
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    setSize((current) =>
      current.width === width && current.height === height ? current : { width, height },
    );
  }, [visible, title, rows, placement]);

  if (!visible) {
    return null;
  }

  const { x, y } = position(anchor, placement, size, bounds);

  return (
    <div
      ref={ref}
      id={id}
      role="tooltip"
      className={clsx(styles.root, inline ? styles.inline : styles.stacked, className)}
      style={{ left: x, top: y }}
    >
      {inline ? (
        <>
          <strong className={styles.title}>{title}</strong>
          {rows.map((row) => (
            <span key={row.id}>
              {CHART_TOOLTIP_SEPARATOR}
              {row.label === null ? row.value : `${row.label} ${row.value}`}
            </span>
          ))}
        </>
      ) : (
        <>
          <strong className={styles.title}>{title}</strong>
          {rows.map((row) => (
            <span key={row.id} className={styles.row}>
              {row.color !== null && (
                <span aria-hidden="true" className={clsx(styles.dot, styles[row.color])} />
              )}
              {row.label !== null && <span>{row.label}</span>}
              <span className={styles.value}>{row.value}</span>
            </span>
          ))}
        </>
      )}
    </div>
  );
}
