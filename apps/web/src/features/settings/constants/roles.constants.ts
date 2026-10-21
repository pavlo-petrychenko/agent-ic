import { PermissionAction, PermissionResource, WorkspaceRole } from '@agent-ic/contracts';
import type { RoleMatrixAction } from '@/features/settings/typedefs/role.typedefs';

export interface RoleResourceDefinition {
  readonly id: string;
  readonly resource: PermissionResource;
  readonly labelKey: string;
  readonly noteKey: string | null;
  readonly actions: readonly RoleMatrixAction[];
}

export const ROLE_MATRIX_ACTIONS: readonly RoleMatrixAction[] = [
  PermissionAction.View,
  PermissionAction.Edit,
  PermissionAction.Publish,
  PermissionAction.Delete,
];

export const ROLE_ACTION_LABEL_KEYS = {
  [PermissionAction.View]: 'roles.matrix.view',
  [PermissionAction.Edit]: 'roles.matrix.edit',
  [PermissionAction.Publish]: 'roles.matrix.publish',
  [PermissionAction.Delete]: 'roles.matrix.delete',
} as const;

export const ROLE_RESOURCE_DEFINITIONS = [
  {
    id: 'agents',
    resource: PermissionResource.Agents,
    labelKey: 'roles.resource.agents',
    noteKey: 'roles.resource.agentsNote',
    actions: [
      PermissionAction.View,
      PermissionAction.Edit,
      PermissionAction.Publish,
      PermissionAction.Delete,
    ],
  },
  {
    id: 'prompts',
    resource: PermissionResource.Prompts,
    labelKey: 'roles.resource.prompts',
    noteKey: null,
    actions: [PermissionAction.View, PermissionAction.Edit, PermissionAction.Delete],
  },
  {
    id: 'knowledgeBases',
    resource: PermissionResource.KnowledgeBases,
    labelKey: 'roles.resource.knowledgeBases',
    noteKey: null,
    actions: [PermissionAction.View, PermissionAction.Edit, PermissionAction.Delete],
  },
  {
    id: 'channels',
    resource: PermissionResource.Channels,
    labelKey: 'roles.resource.channels',
    noteKey: null,
    actions: [PermissionAction.View, PermissionAction.Edit, PermissionAction.Delete],
  },
  {
    id: 'inbox',
    resource: PermissionResource.Inbox,
    labelKey: 'roles.resource.inbox',
    noteKey: 'roles.resource.inboxNote',
    actions: [PermissionAction.View, PermissionAction.Edit, PermissionAction.Delete],
  },
  {
    id: 'testing',
    resource: PermissionResource.Testing,
    labelKey: 'roles.resource.testing',
    noteKey: null,
    actions: [PermissionAction.View, PermissionAction.Edit],
  },
  {
    id: 'analytics',
    resource: PermissionResource.Analytics,
    labelKey: 'roles.resource.analytics',
    noteKey: null,
    actions: [PermissionAction.View],
  },
  {
    id: 'team',
    resource: PermissionResource.Team,
    labelKey: 'roles.resource.team',
    noteKey: null,
    actions: [PermissionAction.View, PermissionAction.Edit, PermissionAction.Delete],
  },
  {
    id: 'workspaceSettings',
    resource: PermissionResource.WorkspaceSettings,
    labelKey: 'roles.resource.workspaceSettings',
    noteKey: null,
    actions: [PermissionAction.View, PermissionAction.Edit],
  },
] as const satisfies readonly RoleResourceDefinition[];

export const SYSTEM_ROLE_COUNT = Object.values(WorkspaceRole).length;

export const NOT_APPLICABLE_MARK = '–';
