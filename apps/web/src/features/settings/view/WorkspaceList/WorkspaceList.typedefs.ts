import type { WorkspaceRow } from '@/features/settings/typedefs/workspace.typedefs';

export interface WorkspaceListProps {
  readonly title: string;
  readonly currentLabel: string;
  readonly leaveLabel: string;
  readonly logOutLabel: string;
  readonly rows: readonly WorkspaceRow[];
  readonly onLeave: (workspaceId: string) => void;
  readonly onLogOut: () => void;
}
