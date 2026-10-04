import type { ComponentProps } from 'react';
import type { InputSize } from '@/shared/ui/Input/Input.constants';

export interface InputProps extends Omit<ComponentProps<'input'>, 'size'> {
  size?: InputSize;
  mono?: boolean;
  invalid?: boolean;
}
