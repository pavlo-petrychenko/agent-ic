import type {
  SwitcherLabels,
  SwitcherWorkspace,
} from '@/features/workspace/typedefs/sidebar.typedefs';

export interface WorkspaceSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeId: string;
  activeName: string | null;
  workspaces: readonly SwitcherWorkspace[];
  labels: SwitcherLabels;
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: () => void;
  onLogOut: () => void;
}
