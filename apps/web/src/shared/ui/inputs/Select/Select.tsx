import clsx from 'clsx';
import { useId } from 'react';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import {
  SELECT_CHEVRON_SIZE,
  SELECT_ERROR_ID_SUFFIX,
  SelectSize,
} from '@/shared/ui/inputs/Select/Select.constants';
import type { SelectProps } from '@/shared/ui/inputs/Select/Select.typedefs';
import styles from '@/shared/ui/inputs/Select/Select.module.scss';

export function Select({
  options,
  size = SelectSize.Md,
  invalid = false,
  error = null,
  disabled = false,
  className,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: SelectProps) {
  const errorId = `${useId()}${SELECT_ERROR_ID_SUFFIX}`;
  const hasError = error !== null;
  const describedBy = [hasError ? errorId : null, ariaDescribedBy]
    .filter((id) => id !== null && id !== undefined)
    .join(' ');

  return (
    <div className={clsx(styles.root, disabled && styles.disabled, className)}>
      <div className={styles.control}>
        <select
          {...rest}
          disabled={disabled}
          aria-invalid={invalid || hasError}
          aria-describedby={describedBy === '' ? undefined : describedBy}
          className={clsx(styles.select, styles[size], (invalid || hasError) && styles.invalid)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled ?? false}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon name={IconName.ChevronDown} size={SELECT_CHEVRON_SIZE} className={styles.chevron} />
      </div>
      {hasError && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
