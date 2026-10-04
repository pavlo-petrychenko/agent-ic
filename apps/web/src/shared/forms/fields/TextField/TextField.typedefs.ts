import type { InputProps } from '@/shared/ui/Input';

export interface TextFieldProps extends Omit<
  InputProps,
  'value' | 'onChange' | 'onBlur' | 'id' | 'name'
> {
  label: string;
  hint?: string | null;
}
