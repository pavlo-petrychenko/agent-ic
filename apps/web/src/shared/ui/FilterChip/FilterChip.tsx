import clsx from 'clsx';
import {
  FILTER_CHIP_CHEVRON_SIZE,
  FILTER_CHIP_CLEAR_SIZE,
  FILTER_CHIP_CLEAR_STROKE_WIDTH,
  FILTER_CHIP_POPUP,
  FILTER_CHIP_SEPARATOR,
} from '@/shared/ui/FilterChip/FilterChip.constants';
import type { FilterChipProps } from '@/shared/ui/FilterChip/FilterChip.typedefs';
import { Icon } from '@/shared/ui/Icon/Icon';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import styles from '@/shared/ui/FilterChip/FilterChip.module.scss';

export function FilterChip({
  label,
  value,
  applied,
  onOpen,
  onClear,
  clearLabel,
  open = false,
  disabled = false,
  className,
}: FilterChipProps) {
  if (!applied) {
    return (
      <button
        type="button"
        aria-haspopup={FILTER_CHIP_POPUP}
        aria-expanded={open}
        disabled={disabled}
        className={clsx(styles.chip, open && styles.open, className)}
        onClick={onOpen}
      >
        <span>{value ?? label}</span>
        <Icon name={IconName.ChevronDown} size={FILTER_CHIP_CHEVRON_SIZE} />
      </button>
    );
  }

  return (
    <span className={clsx(styles.chip, styles.applied, disabled && styles.disabled, className)}>
      <button
        type="button"
        aria-haspopup={FILTER_CHIP_POPUP}
        aria-expanded={open}
        disabled={disabled}
        className={styles.target}
        onClick={onOpen}
      >
        {value === null ? (
          label
        ) : (
          <>
            {label}
            {FILTER_CHIP_SEPARATOR}
            <strong className={styles.value}>{value}</strong>
          </>
        )}
      </button>
      <button
        type="button"
        aria-label={clearLabel}
        disabled={disabled}
        className={clsx(styles.target, styles.clear)}
        onClick={onClear}
      >
        <Icon
          name={IconName.X}
          size={FILTER_CHIP_CLEAR_SIZE}
          strokeWidth={FILTER_CHIP_CLEAR_STROKE_WIDTH}
        />
      </button>
    </span>
  );
}
