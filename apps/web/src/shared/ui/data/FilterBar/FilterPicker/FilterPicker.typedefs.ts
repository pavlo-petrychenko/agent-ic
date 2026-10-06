export interface FilterOption {
  id: string;
  label: string;
  count: string | null;
}

export interface FilterPickerSearch {
  label: string;
  clearLabel: string;
  placeholder: string | null;
}

export interface FilterPickerProps {
  label: string;
  options: readonly FilterOption[];
  selectedIds: readonly string[];
  onSelectedIdsChange: (ids: string[]) => void;
  clearLabel: string;
  ariaLabel: string;
  search?: FilterPickerSearch | null;
  disabled?: boolean;
  className?: string;
}
