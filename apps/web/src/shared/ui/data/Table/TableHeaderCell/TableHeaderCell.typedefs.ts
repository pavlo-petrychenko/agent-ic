import type { SortDirection } from '@/shared/ui/data/ListHead/ListHead.constants';
import type { TableCellAlign } from '@/shared/ui/data/TableCell/TableCell.constants';

export interface TableHeaderCellProps {
  label: string;
  align: TableCellAlign;
  direction: SortDirection | null;
  onSort: (() => void) | null;
  className?: string;
}
