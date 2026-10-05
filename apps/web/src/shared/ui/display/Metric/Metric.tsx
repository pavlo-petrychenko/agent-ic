import clsx from 'clsx';
import type { MetricProps } from '@/shared/ui/display/Metric/Metric.typedefs';
import styles from '@/shared/ui/display/Metric/Metric.module.scss';

export function Metric({ items, className, ...rest }: MetricProps) {
  return (
    <dl {...rest} className={clsx(styles.root, className)}>
      {items.map((item) => (
        <div key={item.label} className={styles.item}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
