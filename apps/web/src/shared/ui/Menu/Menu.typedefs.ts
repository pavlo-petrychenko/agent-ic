import type { ReactNode } from 'react';

export interface MenuItem {
  id: string;
  label: string;
  hint?: string | null;
  mono?: boolean;
  leading?: ReactNode | null;
  trailing?: ReactNode | null;
  disabled?: boolean;
}

export interface MenuProps {
  items: readonly MenuItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  width?: number | null;
  ariaLabel: string;
  className?: string;
}
