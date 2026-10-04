import clsx from 'clsx';
import { SelectSize } from '@/shared/ui/Select/Select.constants';
import type { SelectProps } from '@/shared/ui/Select/Select.typedefs';
import styles from '@/shared/ui/Select/Select.module.scss';

export function Select({
  options,
  size = SelectSize.Md,
  invalid = false,
  className,
  ...rest
}: SelectProps) {
  return (
    <select
      {...rest}
      aria-invalid={invalid}
      className={clsx(styles.root, styles[size], invalid && styles.invalid, className)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled ?? false}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
