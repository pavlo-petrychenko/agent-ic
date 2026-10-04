import type { ComponentProps, ReactNode } from 'react';
import type { ProgressSize, ProgressTone } from '@/shared/ui/Progress/Progress.constants';

export interface ProgressProps extends Omit<ComponentProps<'div'>, 'children'> {
  value: number | null;
  label: string;
  max?: number;
  size?: ProgressSize;
  tone?: ProgressTone;
  caption?: ReactNode | null;
}
