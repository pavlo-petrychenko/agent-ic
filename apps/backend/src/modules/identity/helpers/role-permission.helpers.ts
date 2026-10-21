import { PERMISSION_MATRIX } from '@agent-ic/contracts';
import type { PermissionResource, WorkspaceRole } from '@agent-ic/contracts';
import type { RolePermission } from '@/modules/identity/typedefs/role.typedefs';

export const defaultPermissionsFor = (key: WorkspaceRole): readonly RolePermission[] =>
  (Object.keys(PERMISSION_MATRIX[key]) as PermissionResource[]).flatMap((resource) =>
    PERMISSION_MATRIX[key][resource].map((action) => ({ resource, action })),
  );

export const uniquePermissions = (
  permissions: readonly RolePermission[],
): readonly RolePermission[] => {
  const seen = new Set<string>();
  const unique: RolePermission[] = [];
  for (const permission of permissions) {
    const key = `${permission.resource}:${permission.action}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(permission);
    }
  }
  return unique;
};
