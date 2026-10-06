import type { ComponentProps } from 'react';
import type { PaneBarEdge, PaneBarTone } from '@/shared/ui/layout/PaneBar/PaneBar.constants';

export interface PaneBarProps extends ComponentProps<'div'> {
  edge?: PaneBarEdge;
  tone?: PaneBarTone;
  row?: boolean;
  softLine?: boolean;
  push?: boolean;
}
