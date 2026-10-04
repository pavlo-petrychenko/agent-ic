import type { ComponentProps, ReactNode } from 'react';

export interface BulletListProps extends Omit<ComponentProps<'ul'>, 'children'> {
  items: readonly ReactNode[];
}
