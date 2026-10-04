import clsx from 'clsx';
import type { InputProps } from '@/shared/ui/Input/Input.typedefs';
import styles from '@/shared/ui/Input/Input.module.scss';

export function Input({ invalid = false, className, type = 'text', ...rest }: InputProps) {
  return (
    <input
      {...rest}
      type={type}
      aria-invalid={invalid}
      className={clsx(styles.root, invalid && styles.invalid, className)}
    />
  );
}
