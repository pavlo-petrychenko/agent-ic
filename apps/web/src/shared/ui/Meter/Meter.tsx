import clsx from 'clsx';
import { useId } from 'react';
import { METER_MIN, PERCENT_FULL } from '@/shared/ui/Meter/Meter.constants';
import type { MeterProps } from '@/shared/ui/Meter/Meter.typedefs';
import styles from '@/shared/ui/Meter/Meter.module.scss';

function toPercent(value: number, max: number): number {
  if (max <= METER_MIN) {
    return METER_MIN;
  }
  return Math.min(PERCENT_FULL, Math.max(METER_MIN, (value / max) * PERCENT_FULL));
}

export function Meter({
  label,
  value,
  max,
  valueLabel,
  tone = null,
  className,
  ...rest
}: MeterProps) {
  const labelId = useId();

  return (
    <div
      {...rest}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="meter"
      aria-labelledby={labelId}
      aria-valuemin={METER_MIN}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueLabel}
      className={clsx(styles.root, className)}
    >
      <div className={styles.row}>
        <span id={labelId} className={styles.label}>
          {label}
        </span>
        <span className={styles.value}>{valueLabel}</span>
      </div>
      <div className={styles.track}>
        <div
          className={clsx(styles.fill, tone !== null && styles[tone])}
          style={{ width: `${toPercent(value, max)}%` }}
        />
      </div>
    </div>
  );
}
