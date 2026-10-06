import type { ReactNode } from 'react';
import type { AvatarProps } from '@/shared/ui/display/Avatar';
import type { PaneHeaderHeight } from '@/shared/ui/layout/PaneHeader/PaneHeader.constants';

export interface PaneHeaderProps {
  title: string;
  subtitle?: ReactNode | null;
  avatar?: Omit<AvatarProps, 'size' | 'tone'> | null;
  actions?: ReactNode | null;
  height?: PaneHeaderHeight;
  className?: string;
}
