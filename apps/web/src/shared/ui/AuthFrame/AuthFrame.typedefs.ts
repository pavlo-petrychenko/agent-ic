import type { ComponentProps, ReactNode } from 'react';
import type { AuthCardSize } from '@/shared/ui/AuthFrame/AuthFrame.constants';

export interface AuthFrameProps extends Omit<ComponentProps<'div'>, 'title'> {
  brandName: string;
  size?: AuthCardSize;
  title?: string | null;
  subtitle?: ReactNode | null;
  footer?: ReactNode | null;
  children: ReactNode;
}
