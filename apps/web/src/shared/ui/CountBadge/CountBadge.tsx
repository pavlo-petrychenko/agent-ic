import clsx from 'clsx';
import { COUNT_BADGE_OVERFLOW_SUFFIX } from '@/shared/ui/CountBadge/CountBadge.constants';
import type { CountBadgeProps } from '@/shared/ui/CountBadge/CountBadge.typedefs';
import styles from '@/shared/ui/CountBadge/CountBadge.module.scss';

function formatCount(count: number, max: number | null): string {
  if (max !== null && count > max) {
    return `${max}${COUNT_BADGE_OVERFLOW_SUFFIX}`;
  }
  return String(count);
}

export function CountBadge({ count, max = null, className, ...rest }: CountBadgeProps) {
  return (
    <span {...rest} className={clsx(styles.root, className)}>
      {formatCount(count, max)}
    </span>
  );
}
