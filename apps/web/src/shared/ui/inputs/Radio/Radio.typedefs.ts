import type { RadioOrientation } from '@/shared/ui/inputs/Radio/Radio.constants';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioProps {
  name: string;
  value: string | null;
  onValueChange: (value: string) => void;
  options: readonly RadioOption[];
  ariaLabel: string;
  orientation?: RadioOrientation;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
}
