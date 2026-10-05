import type { MenuItem, MenuSectionLabel, MenuSeparator } from '@/shared/ui/Menu';

export interface WorkspaceSwitcherCurrent {
  id: string;
  name: string;
  roleLabel: string;
}

export interface WorkspaceSwitcherOption {
  id: string;
  name: string;
  roleLabel: string;
  memberCount: number;
}

export interface WorkspaceSwitcherAccountItem extends MenuItem {
  keepOpen?: boolean;
}

export type WorkspaceSwitcherAccountEntry =
  | WorkspaceSwitcherAccountItem
  | MenuSectionLabel
  | MenuSeparator;

export interface WorkspaceSwitcherProps {
  current: WorkspaceSwitcherCurrent;
  options: readonly WorkspaceSwitcherOption[];
  onSelect: (id: string) => void;
  menuLabel: string;
  workspacesLabel: string;
  accountLabel: string;
  formatMemberCount: (count: number) => string;
  accountItems?: readonly WorkspaceSwitcherAccountEntry[];
  onAccountSelect?: ((id: string) => void) | null;
  defaultOpen?: boolean;
  className?: string;
}
