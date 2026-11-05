import type { ReactNode } from 'react';

export interface TimeZoneFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string | null;
  error?: ReactNode | null;
  disabled?: boolean;
  required?: boolean;
  onBlur?: () => void;
}
