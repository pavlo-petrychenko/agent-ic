import type { ComponentProps, ReactNode } from 'react';

export interface RowListRow {
  id: string;
  name: string;
  leading?: ReactNode | null;
  meta?: ReactNode | null;
  disabled?: boolean;
}

export interface RowListProps extends Omit<ComponentProps<'ul'>, 'children'> {
  rows: readonly RowListRow[];
  mono?: boolean;
  onRowSelect?: ((id: string) => void) | null;
}
