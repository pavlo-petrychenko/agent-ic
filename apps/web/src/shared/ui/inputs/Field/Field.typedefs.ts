import type { ReactNode } from 'react';

export interface FieldControlProps {
  readonly id: string;
  readonly 'aria-describedby': string | undefined;
  readonly invalid: boolean;
  readonly required: boolean;
}

export interface FieldProps {
  label: string;
  hint?: string | null;
  error?: ReactNode | null;
  required?: boolean;
  requiredLabel?: string | null;
  children: (control: FieldControlProps) => ReactNode;
}
