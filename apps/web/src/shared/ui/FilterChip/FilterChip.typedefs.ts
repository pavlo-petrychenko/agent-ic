export interface FilterChipProps {
  label: string;
  value: string | null;
  applied: boolean;
  onOpen: () => void;
  onClear: () => void;
  clearLabel: string;
  open?: boolean;
  disabled?: boolean;
  className?: string;
}
