import type { ReactNode } from 'react';

export interface ListGroupProps {
  title: string;
  children: ReactNode;
  count?: number | null;
  addLabel?: string | null;
  onAdd?: (() => void) | null;
  addDisabled?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: ((collapsed: boolean) => void) | null;
  className?: string;
}
