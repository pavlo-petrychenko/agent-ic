import type { ReactNode } from 'react';

export interface NavGroupProps {
  label?: string | null;
  className?: string;
  children: ReactNode;
}
