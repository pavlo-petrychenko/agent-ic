import type { ReactNode } from 'react';
import type { MenuEntryKind, MenuVariant } from '@/shared/ui/Menu/Menu.constants';

export interface MenuItem {
  kind?: MenuEntryKind.Option;
  id: string;
  label: string;
  hint?: string | null;
  shortcut?: string | null;
  mono?: boolean;
  leading?: ReactNode | null;
  trailing?: ReactNode | null;
  disabled?: boolean;
  danger?: boolean;
}

export interface MenuSectionLabel {
  kind: MenuEntryKind.Section;
  id: string;
  label: string;
}

export interface MenuSeparator {
  kind: MenuEntryKind.Separator;
  id: string;
}

export type MenuEntry = MenuItem | MenuSectionLabel | MenuSeparator;

export interface MenuProps {
  items: readonly MenuEntry[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  variant?: MenuVariant;
  width?: number | null;
  ariaLabel: string;
  className?: string;
}
