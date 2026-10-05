import type { ReactNode } from 'react';
import type { BreadcrumbProps } from '@/shared/ui/Breadcrumb';

export type TopbarBreadcrumbs = Pick<BreadcrumbProps, 'items' | 'ariaLabel' | 'moreLabel'>;

export interface TopbarProps {
  breadcrumbs: TopbarBreadcrumbs;
  status?: ReactNode | null;
  actions?: ReactNode | null;
  className?: string;
}
