import type { ComponentProps, ReactNode } from 'react';
import type { TableCellAlign, TableCellTone } from '@/shared/ui/TableCell/TableCell.constants';

export interface TableCellProps extends ComponentProps<'span'> {
  children: ReactNode;
  align?: TableCellAlign;
  tone?: TableCellTone;
  mono?: boolean;
}
