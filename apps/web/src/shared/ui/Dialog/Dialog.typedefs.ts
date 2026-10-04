import type { ReactNode } from 'react';
import type { DialogSize } from '@/shared/ui/Dialog/Dialog.constants';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy?: boolean;
  error?: string | null;
  title: string;
  description?: string | null;
  closeLabel: string;
  size?: DialogSize;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  children?: ReactNode;
}
