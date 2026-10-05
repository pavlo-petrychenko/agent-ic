import type { ReactNode } from 'react';
import type { ButtonSize } from '@/shared/ui/actions/Button';

export interface SubmitButtonProps {
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  children: ReactNode;
}
