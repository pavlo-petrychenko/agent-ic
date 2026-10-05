import clsx from 'clsx';
import {
  ChartColor,
  LEGEND_MIN_VISIBLE_SERIES,
  LegendMarkerKind,
  LegendVariant,
} from '@/shared/ui/display/Legend/Legend.constants';
import type { LegendItem, LegendProps } from '@/shared/ui/display/Legend/Legend.typedefs';
import { StatusDot } from '@/shared/ui/display/StatusDot';
import styles from '@/shared/ui/display/Legend/Legend.module.scss';

function renderMarker(item: LegendItem, hidden: boolean) {
  if (item.marker.kind === LegendMarkerKind.Status) {
    return (
      <span aria-hidden="true" className={styles.statusMarker}>
        <StatusDot kind={item.marker.status} />
      </span>
    );
  }
  const color = hidden ? ChartColor.Muted : item.marker.color;
  return <span aria-hidden="true" className={clsx(styles.swatch, styles[color])} />;
}

export function Legend({
  items,
  hiddenIds = null,
  onToggle = null,
  ariaLabel = null,
  className,
}: LegendProps) {
  const hidden = new Set(hiddenIds ?? []);
  const variant = items.every((item) => item.marker.kind === LegendMarkerKind.Status)
    ? LegendVariant.Status
    : LegendVariant.Series;
  const visibleCount = items.filter((item) => !hidden.has(item.id)).length;

  return (
    <ul
      aria-label={ariaLabel ?? undefined}
      className={clsx(styles.root, styles[variant], className)}
    >
      {items.map((item) => {
        const isHidden = hidden.has(item.id);
        const content = (
          <>
            {renderMarker(item, isHidden)}
            <span className={clsx(styles.label, isHidden && styles.hiddenLabel)}>{item.label}</span>
          </>
        );

        if (onToggle === null) {
          return (
            <li key={item.id} className={styles.item}>
              {content}
            </li>
          );
        }

        const locked = !isHidden && visibleCount <= LEGEND_MIN_VISIBLE_SERIES;

        return (
          <li key={item.id} className={styles.item}>
            <button
              type="button"
              aria-pressed={!isHidden}
              aria-disabled={locked || undefined}
              className={clsx(styles.toggle, locked && styles.locked)}
              onClick={() => {
                if (!locked) {
                  onToggle(item.id);
                }
              }}
            >
              {content}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
