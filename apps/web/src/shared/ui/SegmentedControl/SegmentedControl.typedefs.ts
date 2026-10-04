import type { SegmentedControlSize } from '@/shared/ui/SegmentedControl/SegmentedControl.constants';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  ariaLabel: string;
  size?: SegmentedControlSize;
  disabled?: boolean;
  className?: string;
}
