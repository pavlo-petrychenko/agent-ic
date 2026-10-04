import type { InputProps } from '@/shared/ui/Input';

export interface PasswordFieldProps extends Omit<
  InputProps,
  'value' | 'onChange' | 'onBlur' | 'id' | 'name' | 'type'
> {
  label: string;
  hint?: string | null;
}
