import type { ReactNode } from 'react';
import type { TextareaProps } from '@/shared/ui/inputs/Textarea';

export interface TextareaFieldProps extends Omit<
  TextareaProps,
  'value' | 'onChange' | 'onBlur' | 'id' | 'name'
> {
  label: string;
  hint?: string | null;
  error?: ReactNode | null;
}
