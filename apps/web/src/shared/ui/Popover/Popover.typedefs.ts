import type { ReactElement, ReactNode } from 'react';
import type { PopoverAlign } from '@/shared/ui/Popover/Popover.constants';

export interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactElement;
  align?: PopoverAlign;
  bare?: boolean;
  ariaLabel?: string | null;
  className?: string;
  children: ReactNode;
}
