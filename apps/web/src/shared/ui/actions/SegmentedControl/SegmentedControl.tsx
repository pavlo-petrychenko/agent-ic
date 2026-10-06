import clsx from 'clsx';
import { ToggleGroup } from 'radix-ui';
import { SegmentedControlSize } from '@/shared/ui/actions/SegmentedControl/SegmentedControl.constants';
import type { SegmentedControlProps } from '@/shared/ui/actions/SegmentedControl/SegmentedControl.typedefs';
import styles from '@/shared/ui/actions/SegmentedControl/SegmentedControl.module.scss';

export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  ariaLabel,
  size = SegmentedControlSize.Md,
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  const handleValueChange = (next: string) => {
    const option = options.find((candidate) => candidate.value === next);
    if (option !== undefined && option.value !== value) {
      onValueChange(option.value);
    }
  };

  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={handleValueChange}
      aria-label={ariaLabel}
      disabled={disabled}
      className={clsx(styles.root, styles[size], disabled && styles.disabled, className)}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          className={styles.option}
        >
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
