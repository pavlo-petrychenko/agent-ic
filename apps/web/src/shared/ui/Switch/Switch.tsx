import clsx from 'clsx';
import { Switch as SwitchPrimitive } from 'radix-ui';
import type { SwitchProps } from '@/shared/ui/Switch/Switch.typedefs';
import styles from '@/shared/ui/Switch/Switch.module.scss';

export function Switch({
  checked,
  onCheckedChange,
  label = null,
  disabled = false,
  name,
  id,
  className,
  'aria-label': ariaLabel,
}: SwitchProps) {
  return (
    <label className={clsx(styles.root, disabled && styles.disabled, className)}>
      {label !== null && <span className={styles.text}>{label}</span>}
      <SwitchPrimitive.Root
        id={id}
        name={name}
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        className={styles.track}
        onCheckedChange={onCheckedChange}
      >
        <SwitchPrimitive.Thumb className={styles.thumb} />
      </SwitchPrimitive.Root>
    </label>
  );
}
