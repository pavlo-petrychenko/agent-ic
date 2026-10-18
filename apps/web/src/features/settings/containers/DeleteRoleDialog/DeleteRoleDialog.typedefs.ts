import type { AppRole } from '@/features/settings/typedefs/role.typedefs';

export interface DeleteRoleDialogProps {
  readonly open: boolean;
  readonly busy: boolean;
  readonly error: string | null;
  readonly roleName: string;
  readonly memberCount: number;
  readonly replacementRoleId: string;
  readonly replacementRoles: readonly AppRole[];
  readonly onOpenChange: (open: boolean) => void;
  readonly onReplacementChange: (roleId: string) => void;
  readonly onConfirm: () => void;
}

export interface UseDeleteRoleDialogOptions {
  readonly roles: readonly AppRole[];
  readonly onDeleted: () => void;
}

export interface UseDeleteRoleDialogResult extends DeleteRoleDialogProps {
  readonly openDialog: (role: AppRole) => void;
}
