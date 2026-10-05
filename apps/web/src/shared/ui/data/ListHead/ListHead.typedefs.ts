import type { SortDirection } from '@/shared/ui/data/ListHead/ListHead.constants';

export interface ListHeadSort {
  label: string;
  direction: SortDirection;
}

export interface ListHeadProps {
  countLabel: string;
  sort: ListHeadSort;
  onToggleSort: () => void;
  disabled?: boolean;
  className?: string;
}
