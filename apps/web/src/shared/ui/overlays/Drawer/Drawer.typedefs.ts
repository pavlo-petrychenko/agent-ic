import type { ReactNode } from 'react';

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ariaLabel: string;
  width?: number | null;
  top?: number | null;
  scrim?: boolean;
  className?: string;
  children: ReactNode;
}
