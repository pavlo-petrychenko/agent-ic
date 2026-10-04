import type { InputProps } from '../Input';

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showLabel: string;
  hideLabel: string;
}
