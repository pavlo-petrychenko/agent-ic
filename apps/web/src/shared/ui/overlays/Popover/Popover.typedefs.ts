import type { ReactElement, ReactNode } from 'react';
import type { PopoverAlign } from '@/shared/ui/overlays/Popover/Popover.constants';

export interface PopoverPoint {
  x: number;
  y: number;
}

export interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: ReactElement | null;
  anchor?: PopoverPoint | null;
  align?: PopoverAlign;
  bare?: boolean;
  ariaLabel?: string | null;
  onEscapeKeyDown?: (() => void) | null;
  className?: string;
  children: ReactNode;
}
