import type { ReactElement, ReactNode } from 'react';
import type { TooltipSide } from '@/shared/ui/Tooltip/Tooltip.constants';

export interface TooltipProps {
  content: ReactNode;
  side?: TooltipSide;
  className?: string;
  children: ReactElement;
}
