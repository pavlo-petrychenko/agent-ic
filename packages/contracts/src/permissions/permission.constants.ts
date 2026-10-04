export enum WorkspaceRole {
  Owner = 'owner',
  Admin = 'admin',
  Builder = 'builder',
  Operator = 'operator',
}

export enum PermissionResource {
  Agents = 'agents',
  Prompts = 'prompts',
  KnowledgeBases = 'knowledge_bases',
  Channels = 'channels',
  Inbox = 'inbox',
  Testing = 'testing',
  Analytics = 'analytics',
  Team = 'team',
  WorkspaceSettings = 'workspace_settings',
}

export enum PermissionAction {
  View = 'view',
  Edit = 'edit',
  Publish = 'publish',
  Delete = 'delete',
}

export type ResourcePermissions = Readonly<Record<PermissionResource, readonly PermissionAction[]>>;

const MANAGE: readonly PermissionAction[] = [
  PermissionAction.View,
  PermissionAction.Edit,
  PermissionAction.Delete,
];
const MANAGE_AND_PUBLISH: readonly PermissionAction[] = [...MANAGE, PermissionAction.Publish];
const VIEW_ONLY: readonly PermissionAction[] = [PermissionAction.View];
const VIEW_AND_EDIT: readonly PermissionAction[] = [PermissionAction.View, PermissionAction.Edit];
const NONE: readonly PermissionAction[] = [];

const FULL_ACCESS: ResourcePermissions = {
  [PermissionResource.Agents]: MANAGE_AND_PUBLISH,
  [PermissionResource.Prompts]: MANAGE,
  [PermissionResource.KnowledgeBases]: MANAGE,
  [PermissionResource.Channels]: MANAGE,
  [PermissionResource.Inbox]: MANAGE,
  [PermissionResource.Testing]: MANAGE,
  [PermissionResource.Analytics]: MANAGE,
  [PermissionResource.Team]: MANAGE,
  [PermissionResource.WorkspaceSettings]: MANAGE,
};

export const PERMISSION_MATRIX: Readonly<Record<WorkspaceRole, ResourcePermissions>> = {
  [WorkspaceRole.Owner]: FULL_ACCESS,
  [WorkspaceRole.Admin]: FULL_ACCESS,
  [WorkspaceRole.Builder]: {
    [PermissionResource.Agents]: MANAGE_AND_PUBLISH,
    [PermissionResource.Prompts]: MANAGE,
    [PermissionResource.KnowledgeBases]: MANAGE,
    [PermissionResource.Channels]: MANAGE,
    [PermissionResource.Inbox]: NONE,
    [PermissionResource.Testing]: MANAGE,
    [PermissionResource.Analytics]: VIEW_ONLY,
    [PermissionResource.Team]: NONE,
    [PermissionResource.WorkspaceSettings]: NONE,
  },
  [WorkspaceRole.Operator]: {
    [PermissionResource.Agents]: NONE,
    [PermissionResource.Prompts]: NONE,
    [PermissionResource.KnowledgeBases]: NONE,
    [PermissionResource.Channels]: NONE,
    [PermissionResource.Inbox]: VIEW_AND_EDIT,
    [PermissionResource.Testing]: NONE,
    [PermissionResource.Analytics]: NONE,
    [PermissionResource.Team]: NONE,
    [PermissionResource.WorkspaceSettings]: NONE,
  },
};

export const INVITABLE_ROLES: readonly WorkspaceRole[] = [
  WorkspaceRole.Admin,
  WorkspaceRole.Builder,
  WorkspaceRole.Operator,
];

export const DEFAULT_INVITE_ROLE = WorkspaceRole.Operator;
