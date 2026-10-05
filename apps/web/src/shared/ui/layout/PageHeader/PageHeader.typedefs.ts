import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode | null;
  crumbs?: ReactNode | null;
  actions?: ReactNode | null;
}
