import type { ReactNode } from 'react';
import type { ComboboxProps } from '@/shared/ui/inputs/Combobox';

export interface ComboboxFieldProps extends Omit<
  ComboboxProps,
  'value' | 'onChange' | 'id' | 'invalid' | 'error'
> {
  label: string;
  hint?: string | null;
  error?: ReactNode | null;
}
