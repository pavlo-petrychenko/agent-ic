import type { ComponentProps } from 'react';

export interface CountBadgeProps extends Omit<ComponentProps<'span'>, 'children'> {
  count: number;
  max?: number | null;
}
