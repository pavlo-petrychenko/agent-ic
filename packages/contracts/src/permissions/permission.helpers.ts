import { INVITABLE_ROLES, PERMISSION_MATRIX } from '@contracts/permissions/permission.constants';
import type {
  PermissionAction,
  PermissionResource,
  WorkspaceRole,
} from '@contracts/permissions/permission.constants';

export const can = (
  role: WorkspaceRole,
  resource: PermissionResource,
  action: PermissionAction,
): boolean => PERMISSION_MATRIX[role][resource].includes(action);

export const isInvitableRole = (role: WorkspaceRole): boolean => INVITABLE_ROLES.includes(role);
