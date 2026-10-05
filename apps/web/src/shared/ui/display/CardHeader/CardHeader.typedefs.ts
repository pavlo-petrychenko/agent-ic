import type { ComponentProps, ReactNode } from 'react';
import type { CardHeaderLevel } from '@/shared/ui/display/CardHeader/CardHeader.constants';

export interface CardHeaderProps extends Omit<ComponentProps<'div'>, 'title'> {
  title: ReactNode;
  sub?: ReactNode | null;
  right?: ReactNode | null;
  tag?: ReactNode | null;
  headingLevel?: CardHeaderLevel;
}
