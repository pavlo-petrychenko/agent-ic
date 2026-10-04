import type {
  NavGroupKey,
  WorkspaceSection,
} from '@/features/workspace/constants/navigation.constants';
import type { IconName } from '@/shared/ui/Icon';

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
