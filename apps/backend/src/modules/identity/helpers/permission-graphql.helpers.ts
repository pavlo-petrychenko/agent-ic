import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import type { RolePermission } from '@/modules/identity/typedefs/role.typedefs';
import {
  PermissionAction as GraphqlPermissionAction,
  PermissionResource as GraphqlPermissionResource,
} from '@/platform/graphql-server/generated/schema.generated';
import type { RolePermission as GraphqlRolePermission } from '@/platform/graphql-server/generated/schema.generated';

export const RESOURCE_TO_GRAPHQL: Readonly<Record<PermissionResource, GraphqlPermissionResource>> =
  {
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

export const RESOURCE_FROM_GRAPHQL: Readonly<
  Record<GraphqlPermissionResource, PermissionResource>
> = {
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

export const ACTION_TO_GRAPHQL: Readonly<Record<PermissionAction, GraphqlPermissionAction>> = {
  [PermissionAction.View]: GraphqlPermissionAction.View,
  [PermissionAction.Edit]: GraphqlPermissionAction.Edit,
  [PermissionAction.Publish]: GraphqlPermissionAction.Publish,
  [PermissionAction.Delete]: GraphqlPermissionAction.Delete,
  [PermissionAction.Transfer]: GraphqlPermissionAction.Transfer,
  [PermissionAction.Leave]: GraphqlPermissionAction.Leave,
};

export const ACTION_FROM_GRAPHQL: Readonly<Record<GraphqlPermissionAction, PermissionAction>> = {
  [GraphqlPermissionAction.View]: PermissionAction.View,
  [GraphqlPermissionAction.Edit]: PermissionAction.Edit,
  [GraphqlPermissionAction.Publish]: PermissionAction.Publish,
  [GraphqlPermissionAction.Delete]: PermissionAction.Delete,
  [GraphqlPermissionAction.Transfer]: PermissionAction.Transfer,
  [GraphqlPermissionAction.Leave]: PermissionAction.Leave,
};

export const toGraphqlPermissions = (
  permissions: readonly RolePermission[],
): GraphqlRolePermission[] =>
  permissions.map((permission) => ({
    resource: RESOURCE_TO_GRAPHQL[permission.resource],
    action: ACTION_TO_GRAPHQL[permission.action],
  }));
