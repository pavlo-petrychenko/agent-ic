import type { ReactNode } from 'react';
import type { NavItemData } from '@/shared/ui/navigation/NavItem/NavItem.typedefs';

export interface RailExpand {
  label: string;
  onClick: () => void;
}

export interface RailProps {
  logo: ReactNode;
  groups: readonly (readonly NavItemData[])[];
  footerItems: readonly NavItemData[];
  ariaLabel: string;
  expand?: RailExpand | null;
  account?: ReactNode | null;
  className?: string;
}
