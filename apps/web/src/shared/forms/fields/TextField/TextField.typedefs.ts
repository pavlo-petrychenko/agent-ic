import type { ReactNode } from 'react';
import type { InputProps } from '@/shared/ui/inputs/Input';

export interface TextFieldProps extends Omit<
  InputProps,
  'value' | 'onChange' | 'onBlur' | 'id' | 'name'
> {
  label: string;
  hint?: string | null;
  error?: ReactNode | null;
}
