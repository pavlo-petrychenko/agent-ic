import clsx from 'clsx';
import { InputSize } from '@/shared/ui/inputs/Input/Input.constants';
import type { InputProps } from '@/shared/ui/inputs/Input/Input.typedefs';
import styles from '@/shared/ui/inputs/Input/Input.module.scss';

export function Input({
  size = InputSize.Md,
  mono = false,
  invalid = false,
  className,
  type = 'text',
  ...rest
}: InputProps) {
  return (
    <input
      {...rest}
      type={type}
      aria-invalid={invalid}
      className={clsx(
        styles.root,
        styles[size],
        mono && styles.mono,
        invalid && styles.invalid,
        className,
      )}
    />
  );
}
