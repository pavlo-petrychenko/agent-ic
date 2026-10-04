import type { ReactNode } from 'react';
import type { ButtonSize } from '@/shared/ui/Button';

export interface SubmitButtonProps {
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  children: ReactNode;
}
