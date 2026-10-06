import type { InputProps } from '@/shared/ui/inputs/Input';

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showLabel: string;
  hideLabel: string;
}
