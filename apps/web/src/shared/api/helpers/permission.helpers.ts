import { PermissionResource } from '@agent-ic/contracts';
import type { PermissionAction, ResourcePermissions } from '@agent-ic/contracts';
import {
  ACTION_FROM_API,
  ACTION_TO_API,
  RESOURCE_FROM_API,
  RESOURCE_TO_API,
} from '@/shared/api/constants/permission.constants';
import type {
  PermissionAction as ApiPermissionAction,
  PermissionResource as ApiPermissionResource,
  RolePermissionInput,
} from '@/shared/api/generated/schema.generated';

export interface ApiPermission {
  readonly resource: ApiPermissionResource;
  readonly action: ApiPermissionAction;
}

export const emptyResourcePermissions = (): Record<PermissionResource, PermissionAction[]> => ({
  [PermissionResource.Agents]: [],
  [PermissionResource.Prompts]: [],
  [PermissionResource.KnowledgeBases]: [],
  [PermissionResource.Channels]: [],
  [PermissionResource.Inbox]: [],
  [PermissionResource.Testing]: [],
  [PermissionResource.Analytics]: [],
  [PermissionResource.Team]: [],
  [PermissionResource.WorkspaceSettings]: [],
});

export const toResourcePermissions = (
  permissions: readonly ApiPermission[],
): ResourcePermissions => {
  const matrix = emptyResourcePermissions();
  for (const permission of permissions) {
    matrix[RESOURCE_FROM_API[permission.resource]].push(ACTION_FROM_API[permission.action]);
  }
  return matrix;
};

export const hasPermission = (
  permissions: ResourcePermissions,
  resource: PermissionResource,
  action: PermissionAction,
): boolean => permissions[resource].includes(action);

export const toPermissionInputs = (permissions: ResourcePermissions): RolePermissionInput[] =>
  (Object.keys(permissions) as PermissionResource[]).flatMap((resource) =>
    permissions[resource].map((action) => ({
      resource: RESOURCE_TO_API[resource],
      action: ACTION_TO_API[action],
    })),
  );
