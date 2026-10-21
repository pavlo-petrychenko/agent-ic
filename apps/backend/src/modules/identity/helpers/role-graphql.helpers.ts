import {
  ACTION_FROM_GRAPHQL,
  RESOURCE_FROM_GRAPHQL,
  toGraphqlPermissions,
} from '@/modules/identity/helpers/permission-graphql.helpers';
import {
  GRAPHQL_WORKSPACE_ROLE,
  WORKSPACE_ROLE_FROM_GRAPHQL,
} from '@/modules/identity/helpers/workspace-graphql.helpers';
import type {
  CreateRoleInput,
  DeleteRoleInput,
  RenameRoleInput,
  RoleView,
  UpdateRolePermissionsInput,
} from '@/modules/identity/typedefs/role.typedefs';
import type {
  CreateRoleInput as GraphqlCreateRoleArgs,
  DeleteRoleInput as GraphqlDeleteRoleArgs,
  RenameRoleInput as GraphqlRenameRoleArgs,
  Role as GraphqlRole,
  UpdateRolePermissionsInput as GraphqlUpdateRolePermissionsArgs,
} from '@/platform/graphql-server/generated/schema.generated';

export const toGraphqlRole = (role: RoleView): GraphqlRole => ({
  id: role.id,
  key: GRAPHQL_WORKSPACE_ROLE[role.key],
  name: role.name,
  description: role.description,
  isSystem: role.isSystem,
  memberCount: role.memberCount,
  permissions: toGraphqlPermissions(role.permissions),
});

export const toCreateRoleInput = (args: GraphqlCreateRoleArgs): CreateRoleInput => ({
  name: args.name,
  baseRole: WORKSPACE_ROLE_FROM_GRAPHQL[args.baseRole],
  description: args.description,
  permissions:
    args.permissions === null
      ? null
      : args.permissions.map((permission) => ({
          resource: RESOURCE_FROM_GRAPHQL[permission.resource],
          action: ACTION_FROM_GRAPHQL[permission.action],
        })),
});

export const toRenameRoleInput = (args: GraphqlRenameRoleArgs): RenameRoleInput => ({
  roleId: args.roleId,
  name: args.name,
});

export const toUpdateRolePermissionsInput = (
  args: GraphqlUpdateRolePermissionsArgs,
): UpdateRolePermissionsInput => ({
  roleId: args.roleId,
  permissions: args.permissions.map((permission) => ({
    resource: RESOURCE_FROM_GRAPHQL[permission.resource],
    action: ACTION_FROM_GRAPHQL[permission.action],
  })),
});

export const toDeleteRoleInput = (args: GraphqlDeleteRoleArgs): DeleteRoleInput => ({
  roleId: args.roleId,
  replacementRoleId: args.replacementRoleId,
});
