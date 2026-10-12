import type { WorkspaceRole } from '@agent-ic/contracts';

export interface RoleListItem {
  readonly id: WorkspaceRole;
  readonly title: string;
  readonly description: string;
}

export interface RoleListProps {
  readonly roles: readonly RoleListItem[];
  readonly selectedId: WorkspaceRole;
  readonly ariaLabel: string;
  readonly newRoleLabel: string;
  readonly onSelect: (id: WorkspaceRole) => void;
  readonly onNewRole: () => void;
}
