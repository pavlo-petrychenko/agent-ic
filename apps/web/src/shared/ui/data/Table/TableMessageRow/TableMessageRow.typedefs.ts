import type { ReactNode } from 'react';
import type { TableMessageRowKind } from '@/shared/ui/data/Table/TableMessageRow/TableMessageRow.constants';

export interface TableMessageRowProps {
  kind: TableMessageRowKind;
  columnCount: number;
  children: ReactNode;
}
