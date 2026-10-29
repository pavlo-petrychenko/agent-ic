import type { ReactNode } from 'react';
import type { DurationUnit } from '@/shared/forms/constants/duration.constants';

export interface DurationFieldProps {
  label: string;
  value: number;
  base: DurationUnit;
  onChange: (value: number) => void;
  units?: readonly DurationUnit[] | null;
  hint?: string | null;
  error?: ReactNode | null;
  disabled?: boolean;
}
