import type {
  NavGroupKey,
  WorkspaceSection,
} from '@/features/workspace/constants/navigation.constants';
import type { IconName } from '@/shared/ui/foundations/Icon';

export interface SidebarItem {
  readonly section: WorkspaceSection;
  readonly label: string;
  readonly icon: IconName;
}

export interface SidebarGroup {
  readonly key: NavGroupKey;
  readonly label: string | null;
  readonly items: readonly SidebarItem[];
}

export interface SidebarUser {
  readonly name: string;
  readonly initials: string;
  readonly roleLabel: string | null;
}

export interface SwitcherWorkspace {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly hint: string;
}

export interface SwitcherLabels {
  readonly workspaces: string;
  readonly account: string;
  readonly caption: string;
  readonly createWorkspace: string;
  readonly logOut: string;
}
