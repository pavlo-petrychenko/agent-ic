import clsx from 'clsx';

import { ButtonSize, ButtonVariant } from './Button.constants';
import styles from './Button.module.scss';
import type { ButtonProps } from './Button.typedefs';

export function Button({
  variant = ButtonVariant.Primary,
  size = ButtonSize.Md,
  loading = false,
  disabled = false,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={clsx(
        styles.root,
        styles[variant],
        styles[size],
        loading && styles.loading,
        className,
      )}
    >
      {children}
    </button>
  );
}
