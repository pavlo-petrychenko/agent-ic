import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import {
  GRAPHQL_WORKSPACE_ROLE,
  WORKSPACE_ROLE_FROM_GRAPHQL,
} from '@/modules/identity/helpers/workspace-graphql.helpers';
import type {
  CreateRoleInput,
  RenameRoleInput,
  RolePermission,
  RoleView,
  UpdateRolePermissionsInput,
} from '@/modules/identity/typedefs/role.typedefs';
import type {
  CreateRoleInput as GraphqlCreateRoleArgs,
  RenameRoleInput as GraphqlRenameRoleArgs,
  Role as GraphqlRole,
  RolePermission as GraphqlRolePermission,
  UpdateRolePermissionsInput as GraphqlUpdateRolePermissionsArgs,
} from '@/platform/graphql-server/generated/schema.generated';
import {
  PermissionAction as GraphqlPermissionAction,
  PermissionResource as GraphqlPermissionResource,
} from '@/platform/graphql-server/generated/schema.generated';

const RESOURCE_TO_GRAPHQL: Readonly<Record<PermissionResource, GraphqlPermissionResource>> = {
  [PermissionResource.Agents]: GraphqlPermissionResource.Agents,
  [PermissionResource.Prompts]: GraphqlPermissionResource.Prompts,
  [PermissionResource.KnowledgeBases]: GraphqlPermissionResource.KnowledgeBases,
  [PermissionResource.Channels]: GraphqlPermissionResource.Channels,
  [PermissionResource.Inbox]: GraphqlPermissionResource.Inbox,
  [PermissionResource.Testing]: GraphqlPermissionResource.Testing,
  [PermissionResource.Analytics]: GraphqlPermissionResource.Analytics,
  [PermissionResource.Team]: GraphqlPermissionResource.Team,
  [PermissionResource.WorkspaceSettings]: GraphqlPermissionResource.WorkspaceSettings,
};

const RESOURCE_FROM_GRAPHQL: Readonly<Record<GraphqlPermissionResource, PermissionResource>> = {
  [GraphqlPermissionResource.Agents]: PermissionResource.Agents,
  [GraphqlPermissionResource.Prompts]: PermissionResource.Prompts,
  [GraphqlPermissionResource.KnowledgeBases]: PermissionResource.KnowledgeBases,
  [GraphqlPermissionResource.Channels]: PermissionResource.Channels,
  [GraphqlPermissionResource.Inbox]: PermissionResource.Inbox,
  [GraphqlPermissionResource.Testing]: PermissionResource.Testing,
  [GraphqlPermissionResource.Analytics]: PermissionResource.Analytics,
  [GraphqlPermissionResource.Team]: PermissionResource.Team,
  [GraphqlPermissionResource.WorkspaceSettings]: PermissionResource.WorkspaceSettings,
};

const ACTION_TO_GRAPHQL: Readonly<Record<PermissionAction, GraphqlPermissionAction>> = {
  [PermissionAction.View]: GraphqlPermissionAction.View,
  [PermissionAction.Edit]: GraphqlPermissionAction.Edit,
  [PermissionAction.Publish]: GraphqlPermissionAction.Publish,
  [PermissionAction.Delete]: GraphqlPermissionAction.Delete,
  [PermissionAction.Transfer]: GraphqlPermissionAction.Transfer,
  [PermissionAction.Leave]: GraphqlPermissionAction.Leave,
};

const ACTION_FROM_GRAPHQL: Readonly<Record<GraphqlPermissionAction, PermissionAction>> = {
  [GraphqlPermissionAction.View]: PermissionAction.View,
  [GraphqlPermissionAction.Edit]: PermissionAction.Edit,
  [GraphqlPermissionAction.Publish]: PermissionAction.Publish,
  [GraphqlPermissionAction.Delete]: PermissionAction.Delete,
  [GraphqlPermissionAction.Transfer]: PermissionAction.Transfer,
  [GraphqlPermissionAction.Leave]: PermissionAction.Leave,
};

const toGraphqlPermission = (permission: RolePermission): GraphqlRolePermission => ({
  resource: RESOURCE_TO_GRAPHQL[permission.resource],
  action: ACTION_TO_GRAPHQL[permission.action],
});

export const toGraphqlRole = (role: RoleView): GraphqlRole => ({
  id: role.id,
  key: GRAPHQL_WORKSPACE_ROLE[role.key],
  name: role.name,
  isSystem: role.isSystem,
  memberCount: role.memberCount,
  permissions: role.permissions.map(toGraphqlPermission),
});

export const toCreateRoleInput = (args: GraphqlCreateRoleArgs): CreateRoleInput => ({
  name: args.name,
  baseRole: WORKSPACE_ROLE_FROM_GRAPHQL[args.baseRole],
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
