import type { HTMLAttributes, ReactNode } from 'react';
import type { HeadingElement } from '@/shared/ui/Heading';

export interface ChartCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: string;
  meta?: ReactNode | null;
  legend?: ReactNode | null;
  headingAs?: HeadingElement;
  children: ReactNode;
}
