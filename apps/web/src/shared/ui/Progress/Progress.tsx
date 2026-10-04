import clsx from 'clsx';
import {
  PERCENT_FULL,
  PROGRESS_DEFAULT_MAX,
  PROGRESS_MIN,
  ProgressSize,
  ProgressTone,
} from '@/shared/ui/Progress/Progress.constants';
import type { ProgressProps } from '@/shared/ui/Progress/Progress.typedefs';
import styles from '@/shared/ui/Progress/Progress.module.scss';

function toPercent(value: number, max: number): number {
  if (max <= PROGRESS_MIN) {
    return PROGRESS_MIN;
  }
  return Math.min(PERCENT_FULL, Math.max(PROGRESS_MIN, (value / max) * PERCENT_FULL));
}

export function Progress({
  value,
  label,
  max = PROGRESS_DEFAULT_MAX,
  size = ProgressSize.Md,
  tone = ProgressTone.Accent,
  className,
  ...rest
}: ProgressProps) {
  return (
    <div
      {...rest}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="progressbar"
      aria-label={label}
      aria-valuemin={PROGRESS_MIN}
      aria-valuemax={max}
      aria-valuenow={value ?? undefined}
      className={clsx(styles.root, styles[size], styles[tone], className)}
    >
      <div
        className={clsx(styles.fill, value === null && styles.indeterminate)}
        style={value === null ? undefined : { width: `${toPercent(value, max)}%` }}
      />
    </div>
  );
}
