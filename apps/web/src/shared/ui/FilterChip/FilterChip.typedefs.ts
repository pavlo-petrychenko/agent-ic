export interface FilterChipProps {
  label: string;
  value: string | null;
  applied: boolean;
  onOpen: () => void;
  onClear: () => void;
  clearLabel: string;
  extraCount?: number;
  open?: boolean;
  disabled?: boolean;
  className?: string;
}
