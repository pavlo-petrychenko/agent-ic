import { PermissionResource } from '@agent-ic/contracts';
import type { PermissionAction, ResourcePermissions } from '@agent-ic/contracts';
import type { RolesQuery } from '@/features/settings/communication/gql/query/roles.generated';
import type { AppRole } from '@/features/settings/typedefs/role.typedefs';
import {
  ACTION_FROM_API,
  ACTION_TO_API,
  RESOURCE_FROM_API,
  RESOURCE_TO_API,
} from '@/shared/api/constants/permission.constants';
import { ROLE_FROM_API } from '@/shared/api/constants/workspaceRole.constants';
import type {
  PermissionAction as ApiPermissionAction,
  PermissionResource as ApiPermissionResource,
  RolePermissionInput,
  WorkspaceRole as ApiWorkspaceRole,
} from '@/shared/api/generated/schema.generated';

interface RolePermissionNode {
  readonly resource: ApiPermissionResource;
  readonly action: ApiPermissionAction;
}

interface RoleNode {
  readonly id: string;
  readonly key: ApiWorkspaceRole;
  readonly name: string | null;
  readonly description: string | null;
  readonly isSystem: boolean;
  readonly memberCount: number;
  readonly permissions: readonly RolePermissionNode[];
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
  permissions: readonly RolePermissionNode[],
): ResourcePermissions => {
  const matrix = emptyResourcePermissions();
  for (const permission of permissions) {
    matrix[RESOURCE_FROM_API[permission.resource]].push(ACTION_FROM_API[permission.action]);
  }
  return matrix;
};

export const toPermissionInputs = (permissions: ResourcePermissions): RolePermissionInput[] =>
  (Object.keys(permissions) as PermissionResource[]).flatMap((resource) =>
    permissions[resource].map((action) => ({
      resource: RESOURCE_TO_API[resource],
      action: ACTION_TO_API[action],
    })),
  );

export const toAppRole = (role: RoleNode): AppRole => ({
  id: role.id,
  key: ROLE_FROM_API[role.key],
  name: role.name,
  description: role.description,
  isSystem: role.isSystem,
  memberCount: role.memberCount,
  permissions: toResourcePermissions(role.permissions),
});

export const toRoles = (data: RolesQuery): readonly AppRole[] => data.roles.map(toAppRole);
