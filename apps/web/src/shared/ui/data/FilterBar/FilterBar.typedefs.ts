import type { ReactNode } from 'react';
import type { FilterPickerProps } from '@/shared/ui/data/FilterBar/FilterPicker';

export interface FilterBarFilter extends Omit<FilterPickerProps, 'className'> {
  id: string;
}

export interface FilterBarSearch {
  query: string;
  onQueryChange: (query: string) => void;
  label: string;
  clearLabel: string;
  placeholder?: string | null;
  loading?: boolean;
}

export interface FilterBarProps {
  search: FilterBarSearch | null;
  filters: readonly FilterBarFilter[];
  trailing?: ReactNode | null;
  onClearAll?: (() => void) | null;
  clearAllLabel?: string | null;
  ariaLabel?: string | null;
  className?: string;
}
