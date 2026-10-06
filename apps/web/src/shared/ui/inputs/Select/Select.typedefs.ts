import type { ComponentProps } from 'react';
import type { SelectSize } from '@/shared/ui/inputs/Select/Select.constants';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<ComponentProps<'select'>, 'size' | 'children'> {
  options: readonly SelectOption[];
  size?: SelectSize;
  invalid?: boolean;
  error?: string | null;
}
