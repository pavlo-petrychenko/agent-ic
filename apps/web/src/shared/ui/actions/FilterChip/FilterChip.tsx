import clsx from 'clsx';
import {
  FILTER_CHIP_CHEVRON_SIZE,
  FILTER_CHIP_CLEAR_SIZE,
  FILTER_CHIP_CLEAR_STROKE_WIDTH,
  FILTER_CHIP_EXTRA_PREFIX,
  FILTER_CHIP_POPUP,
  FILTER_CHIP_SEPARATOR,
} from '@/shared/ui/actions/FilterChip/FilterChip.constants';
import type { FilterChipProps } from '@/shared/ui/actions/FilterChip/FilterChip.typedefs';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/actions/FilterChip/FilterChip.module.scss';

export function FilterChip({
  label,
  value,
  applied,
  onOpen,
  onClear,
  clearLabel,
  extraCount = 0,
  open = false,
  disabled = false,
  className,
}: FilterChipProps) {
  const valueText =
    value !== null && extraCount > 0 ? `${value}${FILTER_CHIP_EXTRA_PREFIX}${extraCount}` : value;

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
        <span>{valueText ?? label}</span>
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
        {valueText === null ? (
          label
        ) : (
          <>
            {label}
            {FILTER_CHIP_SEPARATOR}
            <strong className={styles.value}>{valueText}</strong>
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
        <span className={styles.clearMark}>
          <Icon
            name={IconName.X}
            size={FILTER_CHIP_CLEAR_SIZE}
            strokeWidth={FILTER_CHIP_CLEAR_STROKE_WIDTH}
          />
        </span>
      </button>
    </span>
  );
}
