import clsx from 'clsx';

import styles from './Input.module.scss';
import type { InputProps } from './Input.typedefs';

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
