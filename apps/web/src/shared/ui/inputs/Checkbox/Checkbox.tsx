import clsx from 'clsx';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import {
  CHECKBOX_ICON_SIZE,
  CHECKBOX_ICON_STROKE_WIDTH,
  CHECKBOX_INDETERMINATE,
  CheckboxAlign,
} from '@/shared/ui/inputs/Checkbox/Checkbox.constants';
import type { CheckboxProps } from '@/shared/ui/inputs/Checkbox/Checkbox.typedefs';
import styles from '@/shared/ui/inputs/Checkbox/Checkbox.module.scss';

export function Checkbox({
  checked,
  onCheckedChange,
  label = null,
  description = null,
  align = CheckboxAlign.Center,
  disabled = false,
  invalid = false,
  name,
  id,
  className,
  'aria-label': ariaLabel,
}: CheckboxProps) {
  return (
    <label
      className={clsx(
        styles.root,
        align === CheckboxAlign.Top && styles.top,
        disabled && styles.disabled,
        className,
      )}
    >
      <CheckboxPrimitive.Root
        id={id}
        name={name}
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        className={clsx(styles.box, invalid && styles.invalid)}
        onCheckedChange={(next) => onCheckedChange(next === true)}
      >
        <CheckboxPrimitive.Indicator className={styles.indicator}>
          <Icon
            name={checked === CHECKBOX_INDETERMINATE ? IconName.Minus : IconName.Check}
            size={CHECKBOX_ICON_SIZE}
            strokeWidth={CHECKBOX_ICON_STROKE_WIDTH}
          />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label !== null && (
        <span className={styles.text}>
          <span className={styles.title}>{label}</span>
          {description !== null && <span className={styles.caption}>{description}</span>}
        </span>
      )}
    </label>
  );
}
