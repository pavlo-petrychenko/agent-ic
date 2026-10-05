import type { SortDirection } from '@/shared/ui/ListHead/ListHead.constants';
import type { TableCellAlign } from '@/shared/ui/TableCell/TableCell.constants';

export interface TableHeaderCellProps {
  label: string;
  align: TableCellAlign;
  direction: SortDirection | null;
  onSort: (() => void) | null;
  className?: string;
}
