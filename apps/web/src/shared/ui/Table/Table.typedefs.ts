import type { ReactNode } from 'react';
import type { SortDirection } from '@/shared/ui/ListHead/ListHead.constants';
import type { MenuEntry } from '@/shared/ui/Menu/Menu.typedefs';
import type { PaginationProps } from '@/shared/ui/Pagination/Pagination.typedefs';
import type {
  TableColumnPriority,
  TableHeadTone,
  TablePadding,
  TableStatus,
} from '@/shared/ui/Table/Table.constants';
import type { TableCellAlign } from '@/shared/ui/TableCell/TableCell.constants';

export interface TableColumn<T> {
  id: string;
  header: string;
  width: string;
  render: (row: T) => ReactNode;
  align?: TableCellAlign;
  sortable?: boolean;
  priority?: TableColumnPriority;
}

export interface TableSort {
  columnId: string;
  direction: SortDirection;
}

export interface TableSelection<T> {
  selectedIds: readonly string[];
  onSelectedIdsChange: (ids: string[]) => void;
  selectAllLabel: string;
  getRowLabel: (row: T) => string;
  barLabel: string;
  countLabel: string;
  clearLabel: string;
  actions?: ReactNode | null;
}

export interface TableRowActions<T> {
  columnLabel: string;
  menuLabel: string;
  getLabel: (row: T) => string;
  getItems: (row: T) => readonly MenuEntry[];
  onSelect: (row: T, itemId: string) => void;
}

export interface TableExpansion<T> {
  expandedIds: readonly string[];
  onExpandedIdsChange: (ids: string[]) => void;
  renderDetail: (row: T) => ReactNode;
  getExpandLabel: (row: T) => string;
}

export interface TableError {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}

export interface TableProps<T> {
  columns: readonly TableColumn<T>[];
  rows: readonly T[];
  getRowId: (row: T) => string;
  ariaLabel: string;
  title?: string | null;
  toolbarActions?: ReactNode | null;
  padding?: TablePadding;
  headTone?: TableHeadTone;
  currentRowId?: string | null;
  onRowOpen?: ((row: T) => void) | null;
  isRowDisabled?: ((row: T) => boolean) | null;
  sort?: TableSort | null;
  onSortChange?: ((sort: TableSort | null) => void) | null;
  selection?: TableSelection<T> | null;
  rowActions?: TableRowActions<T> | null;
  expansion?: TableExpansion<T> | null;
  status?: TableStatus;
  loadingLabel?: string | null;
  error?: TableError | null;
  empty?: ReactNode | null;
  footer?: ReactNode | null;
  pagination?: PaginationProps | null;
  className?: string;
}
