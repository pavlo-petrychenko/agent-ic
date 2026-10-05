import type { ReactNode } from 'react';

export interface DisplayTitleProps {
  title: string;
  subtitle?: ReactNode | null;
  className?: string;
}
