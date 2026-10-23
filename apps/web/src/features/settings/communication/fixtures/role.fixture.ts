import { PERMISSION_MATRIX, WorkspaceRole } from '@agent-ic/contracts';
import type {
  PermissionAction,
  PermissionResource,
  ResourcePermissions,
} from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { CreateRoleDocument } from '@/features/settings/communication/gql/mutation/createRole.generated';
import { DeleteRoleDocument } from '@/features/settings/communication/gql/mutation/deleteRole.generated';
import { UpdateRolePermissionsDocument } from '@/features/settings/communication/gql/mutation/updateRolePermissions.generated';
import { RolesDocument } from '@/features/settings/communication/gql/query/roles.generated';
import { ACTION_TO_API, RESOURCE_TO_API } from '@/shared/api/constants/permission.constants';
import { ROLE_TO_API } from '@/shared/api/constants/workspaceRole.constants';
import {
  emptyResourcePermissions,
  toPermissionInputs,
} from '@/shared/api/helpers/permission.helpers';

export interface RoleFixture {
  readonly id: string;
  readonly key: WorkspaceRole;
  readonly name: string | null;
  readonly description?: string | null;
  readonly isSystem: boolean;
  readonly memberCount?: number;
}

export const SYSTEM_ROLE_FIXTURES: readonly RoleFixture[] = [
  { id: 'rol_owner', key: WorkspaceRole.Owner, name: null, isSystem: true },
  { id: 'rol_admin', key: WorkspaceRole.Admin, name: null, isSystem: true },
  { id: 'rol_builder', key: WorkspaceRole.Builder, name: null, isSystem: true },
  { id: 'rol_operator', key: WorkspaceRole.Operator, name: null, isSystem: true },
];

export const CONTENT_MANAGER_ROLE: RoleFixture = {
  id: 'rol_content',
  key: WorkspaceRole.Builder,
  name: 'Content manager',
  description: 'Edits prompts and knowledge',
  isSystem: false,
  memberCount: 2,
};

const rolePermissions = (key: WorkspaceRole) =>
  (Object.keys(PERMISSION_MATRIX[key]) as PermissionResource[]).flatMap((resource) =>
    PERMISSION_MATRIX[key][resource].map((action: PermissionAction) => ({
      __typename: 'RolePermission',
      resource: RESOURCE_TO_API[resource],
      action: ACTION_TO_API[action],
    })),
  );

export const resourcePermissionsOf = (
  key: WorkspaceRole,
): Record<PermissionResource, PermissionAction[]> => {
  const permissions = emptyResourcePermissions();
  for (const resource of Object.keys(PERMISSION_MATRIX[key]) as PermissionResource[]) {
    permissions[resource] = [...PERMISSION_MATRIX[key][resource]];
  }
  return permissions;
};

const roleNode = (role: RoleFixture, permissions?: ResourcePermissions) => ({
  __typename: 'Role',
  id: role.id,
  key: role.key,
  name: role.name,
  description: role.description ?? null,
  isSystem: role.isSystem,
  memberCount: role.memberCount ?? 0,
  permissions:
    permissions === undefined
      ? rolePermissions(role.key)
      : toPermissionInputs(permissions).map((permission) => ({
          __typename: 'RolePermission',
          ...permission,
        })),
});

export const buildRoleListMock = (
  roles: readonly RoleFixture[] = SYSTEM_ROLE_FIXTURES,
  maxUsageCount = Number.POSITIVE_INFINITY,
): MockLink.MockedResponse => ({
  request: { query: RolesDocument },
  result: { data: { roles: roles.map((role) => roleNode(role)) } },
  maxUsageCount,
});

export const buildCreateRoleMock = (
  input: {
    readonly name: string;
    readonly baseRole: WorkspaceRole;
    readonly description: string | null;
  },
  created: RoleFixture,
): MockLink.MockedResponse => ({
  request: {
    query: CreateRoleDocument,
    variables: {
      input: {
        name: input.name,
        baseRole: ROLE_TO_API[input.baseRole],
        description: input.description,
        permissions: toPermissionInputs(resourcePermissionsOf(input.baseRole)),
      },
    },
  },
  result: { data: { createRole: roleNode(created) } },
});

export const buildUpdateRolePermissionsMock = (
  role: RoleFixture,
  permissions: ResourcePermissions,
): MockLink.MockedResponse => ({
  request: {
    query: UpdateRolePermissionsDocument,
    variables: { input: { roleId: role.id, permissions: toPermissionInputs(permissions) } },
  },
  result: { data: { updateRolePermissions: roleNode(role, permissions) } },
});

export const buildDeleteRoleMock = (
  roleId: string,
  replacementRoleId: string,
): MockLink.MockedResponse => ({
  request: { query: DeleteRoleDocument, variables: { input: { roleId, replacementRoleId } } },
  result: { data: { deleteRole: true } },
});
