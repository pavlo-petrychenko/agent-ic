import clsx from 'clsx';
import { ButtonSize, ButtonVariant } from '@/shared/ui/Button/Button.constants';
import type { ButtonProps } from '@/shared/ui/Button/Button.typedefs';
import styles from '@/shared/ui/Button/Button.module.scss';

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
