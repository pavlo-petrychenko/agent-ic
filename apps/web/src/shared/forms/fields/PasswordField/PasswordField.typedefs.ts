import type { ReactNode } from 'react';
import type { InputProps } from '@/shared/ui/inputs/Input';

export interface PasswordFieldProps extends Omit<
  InputProps,
  'value' | 'onChange' | 'onBlur' | 'id' | 'name' | 'type'
> {
  label: string;
  hint?: string | null;
  error?: ReactNode | null;
}
