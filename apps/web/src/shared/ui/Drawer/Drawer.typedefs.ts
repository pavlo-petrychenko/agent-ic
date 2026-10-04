import type { ReactNode } from 'react';

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ariaLabel: string;
  width?: number | null;
  className?: string;
  children: ReactNode;
}
