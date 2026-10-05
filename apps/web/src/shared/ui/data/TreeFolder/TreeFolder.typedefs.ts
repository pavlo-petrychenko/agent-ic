import type { ReactNode } from 'react';

export interface TreeFolderProps {
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}
