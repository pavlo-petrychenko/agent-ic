import type { PermissionAction } from '@agent-ic/contracts';
import type { CreateRoleDialogProps } from '@/features/settings/containers/CreateRoleDialog';
import type { RoleMatrixContent } from '@/features/settings/typedefs/role.typedefs';
import type { RoleListItem } from '@/features/settings/view/RoleList';

export interface RolesPageProps {
  readonly workspaceId: string;
}

export interface UseRolesPageResult {
  readonly roles: readonly RoleListItem[];
  readonly selectedId: string;
  readonly selectedTitle: string | null;
  readonly memberCount: number;
  readonly memberNames: readonly string[];
  readonly matrix: RoleMatrixContent;
  readonly locked: boolean;
  readonly saving: boolean;
  readonly hint: string;
  readonly createRoleDialog: CreateRoleDialogProps;
  readonly onSelect: (id: string) => void;
  readonly onToggle: (rowId: string, action: PermissionAction, checked: boolean) => void;
  readonly onSave: () => void;
  readonly onNewRole: () => void;
  readonly onDuplicate: () => void;
}
