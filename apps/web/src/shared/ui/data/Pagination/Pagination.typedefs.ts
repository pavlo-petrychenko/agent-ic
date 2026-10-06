import type { PaginationVariant } from '@/shared/ui/data/Pagination/Pagination.constants';

export interface PaginationProps {
  page: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  rangeLabel: string;
  rowsLabel: string;
  rowsPerPageLabel: string;
  previousLabel: string;
  nextLabel: string;
  navLabel: string;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  variant?: PaginationVariant;
  onLoadMore?: (() => void) | null;
  loadMoreLabel?: string | null;
  loading?: boolean;
  className?: string;
}
