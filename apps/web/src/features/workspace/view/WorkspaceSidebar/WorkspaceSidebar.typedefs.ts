import type { ReactNode } from 'react';
import type { SidebarGroup, SidebarUser } from '@/features/workspace/typedefs/sidebar.typedefs';

export interface WorkspaceSidebarProps {
  workspaceId: string;
  navLabel: string;
  header: ReactNode;
  groups: readonly SidebarGroup[];
  user: SidebarUser | null;
  footerAction: ReactNode;
}
