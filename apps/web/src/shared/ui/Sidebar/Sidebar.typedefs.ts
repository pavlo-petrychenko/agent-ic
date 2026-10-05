import type { NavItemData } from '@/shared/ui/NavItem';
import type { SegmentedControlOption } from '@/shared/ui/SegmentedControl';
import type { WorkspaceSwitcherProps } from '@/shared/ui/WorkspaceSwitcher';

export interface SidebarGroup {
  id: string;
  label: string | null;
  items: readonly NavItemData[];
}

export interface SidebarUser {
  name: string;
  roleLabel: string | null;
  initials: string;
}

export interface SidebarLanguage {
  options: readonly SegmentedControlOption<string>[];
  value: string;
  onValueChange: (value: string) => void;
  ariaLabel: string;
}

export interface SidebarProps {
  workspaceSwitcher: WorkspaceSwitcherProps;
  groups: readonly SidebarGroup[];
  footerItems: readonly NavItemData[];
  user: SidebarUser | null;
  language: SidebarLanguage | null;
  onCollapse: () => void;
  collapseLabel: string;
  ariaLabel: string;
  className?: string;
}
