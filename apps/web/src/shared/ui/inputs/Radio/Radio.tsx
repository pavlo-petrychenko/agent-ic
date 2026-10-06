import clsx from 'clsx';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { RADIO_NO_SELECTION, RadioOrientation } from '@/shared/ui/inputs/Radio/Radio.constants';
import type { RadioProps } from '@/shared/ui/inputs/Radio/Radio.typedefs';
import styles from '@/shared/ui/inputs/Radio/Radio.module.scss';

export function Radio({
  name,
  value,
  onValueChange,
  options,
  ariaLabel,
  orientation = RadioOrientation.Horizontal,
  invalid = false,
  disabled = false,
  className,
}: RadioProps) {
  return (
    <RadioGroupPrimitive.Root
      name={name}
      value={value ?? RADIO_NO_SELECTION}
      onValueChange={onValueChange}
      aria-label={ariaLabel}
      aria-invalid={invalid}
      orientation={orientation}
      disabled={disabled}
      className={clsx(
        styles.root,
        styles[orientation],
        invalid && styles.invalid,
        disabled && styles.disabled,
        className,
      )}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={clsx(styles.option, option.disabled === true && styles.optionDisabled)}
        >
          <RadioGroupPrimitive.Item
            value={option.value}
            disabled={option.disabled ?? false}
            className={styles.circle}
          >
            <RadioGroupPrimitive.Indicator className={styles.dot} />
          </RadioGroupPrimitive.Item>
          <span className={styles.text}>{option.label}</span>
        </label>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
