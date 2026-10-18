import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import {
  PermissionAction as ApiPermissionAction,
  PermissionResource as ApiPermissionResource,
} from '@/shared/api/generated/schema.generated';

export const RESOURCE_FROM_API: Readonly<Record<ApiPermissionResource, PermissionResource>> = {
  [ApiPermissionResource.Agents]: PermissionResource.Agents,
  [ApiPermissionResource.Prompts]: PermissionResource.Prompts,
  [ApiPermissionResource.KnowledgeBases]: PermissionResource.KnowledgeBases,
  [ApiPermissionResource.Channels]: PermissionResource.Channels,
  [ApiPermissionResource.Inbox]: PermissionResource.Inbox,
  [ApiPermissionResource.Testing]: PermissionResource.Testing,
  [ApiPermissionResource.Analytics]: PermissionResource.Analytics,
  [ApiPermissionResource.Team]: PermissionResource.Team,
  [ApiPermissionResource.WorkspaceSettings]: PermissionResource.WorkspaceSettings,
};

export const RESOURCE_TO_API: Readonly<Record<PermissionResource, ApiPermissionResource>> = {
  [PermissionResource.Agents]: ApiPermissionResource.Agents,
  [PermissionResource.Prompts]: ApiPermissionResource.Prompts,
  [PermissionResource.KnowledgeBases]: ApiPermissionResource.KnowledgeBases,
  [PermissionResource.Channels]: ApiPermissionResource.Channels,
  [PermissionResource.Inbox]: ApiPermissionResource.Inbox,
  [PermissionResource.Testing]: ApiPermissionResource.Testing,
  [PermissionResource.Analytics]: ApiPermissionResource.Analytics,
  [PermissionResource.Team]: ApiPermissionResource.Team,
  [PermissionResource.WorkspaceSettings]: ApiPermissionResource.WorkspaceSettings,
};

export const ACTION_FROM_API: Readonly<Record<ApiPermissionAction, PermissionAction>> = {
  [ApiPermissionAction.View]: PermissionAction.View,
  [ApiPermissionAction.Edit]: PermissionAction.Edit,
  [ApiPermissionAction.Publish]: PermissionAction.Publish,
  [ApiPermissionAction.Delete]: PermissionAction.Delete,
  [ApiPermissionAction.Transfer]: PermissionAction.Transfer,
  [ApiPermissionAction.Leave]: PermissionAction.Leave,
};

export const ACTION_TO_API: Readonly<Record<PermissionAction, ApiPermissionAction>> = {
  [PermissionAction.View]: ApiPermissionAction.View,
  [PermissionAction.Edit]: ApiPermissionAction.Edit,
  [PermissionAction.Publish]: ApiPermissionAction.Publish,
  [PermissionAction.Delete]: ApiPermissionAction.Delete,
  [PermissionAction.Transfer]: ApiPermissionAction.Transfer,
  [PermissionAction.Leave]: ApiPermissionAction.Leave,
};
