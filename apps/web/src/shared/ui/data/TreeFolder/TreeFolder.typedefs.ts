import type { MouseEvent, ReactNode } from 'react';

export interface TreeFolderProps {
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
  onContextMenu?: ((event: MouseEvent<HTMLButtonElement>) => void) | null;
  children: ReactNode;
}
