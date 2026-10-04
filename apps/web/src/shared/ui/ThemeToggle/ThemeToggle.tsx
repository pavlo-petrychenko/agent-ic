import clsx from 'clsx';
import { RadioGroup } from 'radix-ui';
import { Icon } from '@/shared/ui/Icon/Icon';
import {
  THEME_TOGGLE_ICON_SIZE,
  THEME_TOGGLE_OPTIONS,
  ThemeToggleSize,
} from '@/shared/ui/ThemeToggle/ThemeToggle.constants';
import type { ThemeToggleProps } from '@/shared/ui/ThemeToggle/ThemeToggle.typedefs';
import styles from '@/shared/ui/ThemeToggle/ThemeToggle.module.scss';

export function ThemeToggle({
  value,
  onChange,
  label,
  optionLabels,
  withLabels = true,
  size = ThemeToggleSize.Md,
  disabled = false,
  className,
}: ThemeToggleProps) {
  const handleValueChange = (next: string) => {
    const option = THEME_TOGGLE_OPTIONS.find((candidate) => candidate.value === next);
    if (option !== undefined) {
      onChange(option.value);
    }
  };

  return (
    <RadioGroup.Root
      value={value}
      onValueChange={handleValueChange}
      aria-label={label}
      orientation="horizontal"
      disabled={disabled}
      className={clsx(styles.root, styles[size], disabled && styles.disabled, className)}
    >
      {THEME_TOGGLE_OPTIONS.map((option) => (
        <RadioGroup.Item
          key={option.value}
          value={option.value}
          aria-label={withLabels ? undefined : optionLabels[option.value]}
          className={styles.option}
        >
          <Icon name={option.icon} size={THEME_TOGGLE_ICON_SIZE} />
          {withLabels && <span>{optionLabels[option.value]}</span>}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
