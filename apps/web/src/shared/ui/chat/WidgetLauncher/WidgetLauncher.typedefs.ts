import type { ComponentProps } from 'react';

export interface WidgetLauncherProps extends Omit<
  ComponentProps<'button'>,
  'children' | 'aria-label' | 'aria-expanded' | 'aria-controls' | 'onClick'
> {
  accent: string;
  open: boolean;
  onToggle: () => void;
  label: string;
  controls?: string | null;
}
