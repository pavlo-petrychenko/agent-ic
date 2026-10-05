import type { InputProps } from '@/shared/ui/Input/Input.typedefs';

export interface SearchInputProps extends Omit<
  InputProps,
  'size' | 'type' | 'value' | 'defaultValue' | 'invalid' | 'mono' | 'aria-label'
> {
  value: string;
  label: string;
  clearLabel: string;
  onClear: () => void;
  loading?: boolean;
}
