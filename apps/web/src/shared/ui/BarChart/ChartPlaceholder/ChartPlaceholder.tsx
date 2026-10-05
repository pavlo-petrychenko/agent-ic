import clsx from 'clsx';
import {
  CHART_PLACEHOLDER_BAR_HEIGHTS,
  CHART_PLACEHOLDER_HEIGHT_UNIT,
  ChartPlaceholderKind,
} from '@/shared/ui/BarChart/ChartPlaceholder/ChartPlaceholder.constants';
import type { ChartPlaceholderProps } from '@/shared/ui/BarChart/ChartPlaceholder/ChartPlaceholder.typedefs';
import styles from '@/shared/ui/BarChart/ChartPlaceholder/ChartPlaceholder.module.scss';

export function ChartPlaceholder(props: ChartPlaceholderProps) {
  if (props.kind === ChartPlaceholderKind.Loading) {
    return (
      <output
        aria-busy="true"
        aria-label={props.label ?? undefined}
        className={clsx(styles.root, styles.loading, props.className)}
        style={{ height: props.height }}
      >
        {CHART_PLACEHOLDER_BAR_HEIGHTS.map((height, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={styles.bar}
            style={{ height: `${height}${CHART_PLACEHOLDER_HEIGHT_UNIT}` }}
          />
        ))}
      </output>
    );
  }

  return (
    <div
      className={clsx(styles.root, styles.empty, props.className)}
      style={{ height: props.height }}
    >
      {props.text !== null && (
        <>
          <p className={styles.title}>{props.text.title}</p>
          {props.text.hint !== null && <p className={styles.hint}>{props.text.hint}</p>}
        </>
      )}
    </div>
  );
}
