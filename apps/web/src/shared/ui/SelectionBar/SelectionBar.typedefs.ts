import type { ReactNode } from 'react';
import type { SelectionBarVariant } from '@/shared/ui/SelectionBar/SelectionBar.constants';

export interface SelectionBarProps {
  countLabel: string;
  ariaLabel: string;
  variant?: SelectionBarVariant;
  actions?: ReactNode | null;
  onClear?: (() => void) | null;
  clearLabel?: string | null;
  className?: string;
}
