import type { PermissionAction, ResourcePermissions, WorkspaceRole } from '@agent-ic/contracts';
import type { AppRole } from '@/features/settings/typedefs/role.typedefs';

export interface CreateRoleDialogDefaults {
  readonly name: string;
  readonly baseRole: WorkspaceRole;
}

export interface CreateRoleDialogProps {
  readonly open: boolean;
  readonly busy: boolean;
  readonly error: string | null;
  readonly name: string;
  readonly description: string;
  readonly baseRole: WorkspaceRole;
  readonly baseRoles: readonly AppRole[];
  readonly permissions: ResourcePermissions;
  readonly onOpenChange: (open: boolean) => void;
  readonly onNameChange: (name: string) => void;
  readonly onDescriptionChange: (description: string) => void;
  readonly onBaseRoleChange: (role: AppRole) => void;
  readonly onToggle: (rowId: string, action: PermissionAction, checked: boolean) => void;
  readonly onSubmit: () => void;
}

export interface UseCreateRoleDialogOptions {
  readonly roles: readonly AppRole[];
  readonly onCreated: (role: AppRole) => void;
}

export interface UseCreateRoleDialogResult extends CreateRoleDialogProps {
  readonly openDialog: (defaults: CreateRoleDialogDefaults) => void;
}
