import type { ReactNode } from 'react';

export interface AuthPanelProps {
  title?: string | null;
  subtitle?: string | null;
  footer?: ReactNode | null;
  children: ReactNode;
}
