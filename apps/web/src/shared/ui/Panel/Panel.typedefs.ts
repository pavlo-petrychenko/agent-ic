import type { ComponentProps, ReactNode } from 'react';
import type { PanelSide, PanelTone } from '@/shared/ui/Panel/Panel.constants';

export interface PanelProps extends Omit<ComponentProps<'aside'>, 'title' | 'aria-label'> {
  ariaLabel: string;
  title?: string | null;
  headRight?: ReactNode | null;
  tone?: PanelTone;
  side?: PanelSide;
  inline?: boolean;
  flush?: boolean;
  footer?: ReactNode | null;
  children?: ReactNode | null;
}
