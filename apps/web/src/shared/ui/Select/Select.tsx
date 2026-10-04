import clsx from 'clsx';
import { useId } from 'react';
import { SELECT_ERROR_ID_SUFFIX, SelectSize } from '@/shared/ui/Select/Select.constants';
import type { SelectProps } from '@/shared/ui/Select/Select.typedefs';
import styles from '@/shared/ui/Select/Select.module.scss';

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
      {hasError && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
