import type { ReactNode } from 'react';
import type { SidebarGroup, SidebarUser } from '@/features/workspace/typedefs/sidebar.typedefs';

export interface WorkspaceSidebarProps {
  workspaceId: string;
  navLabel: string;
  header: ReactNode;
  headerAction: ReactNode;
  groups: readonly SidebarGroup[];
  footerExtra: ReactNode;
  user: SidebarUser | null;
  footerAction: ReactNode;
}
