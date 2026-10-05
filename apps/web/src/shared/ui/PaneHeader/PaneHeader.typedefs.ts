import type { ReactNode } from 'react';
import type { AvatarProps } from '@/shared/ui/Avatar';
import type { PaneHeaderHeight } from '@/shared/ui/PaneHeader/PaneHeader.constants';

export interface PaneHeaderProps {
  title: string;
  subtitle?: ReactNode | null;
  avatar?: Omit<AvatarProps, 'size' | 'tone'> | null;
  actions?: ReactNode | null;
  height?: PaneHeaderHeight;
  className?: string;
}
