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

export const permissionKey = (resource: PermissionResource, action: PermissionAction): string =>
  `${resource}:${action}`;

export const permissionsForRole = (role: WorkspaceRole): ReadonlySet<string> => {
  const permissions = new Set<string>();
  for (const resource of Object.keys(PERMISSION_MATRIX[role]) as PermissionResource[]) {
    for (const action of PERMISSION_MATRIX[role][resource]) {
      permissions.add(permissionKey(resource, action));
    }
  }
  return permissions;
};

export const hasPermission = (
  permissions: ReadonlySet<string>,
  resource: PermissionResource,
  action: PermissionAction,
): boolean => permissions.has(permissionKey(resource, action));
