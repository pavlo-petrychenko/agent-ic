import {
  hasPermission,
  PermissionAction,
  PermissionResource,
  permissionsForRole,
} from '@agent-ic/contracts';
import {
  OPERATOR_MESSAGE_KEY_PREFIX,
  OPERATOR_MESSAGE_KEY_SEPARATOR,
  OPERATOR_RESOURCE,
} from '@/modules/conversations/constants/operator.constants';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { WorkspaceAccess } from '@/platform/context/typedefs/workspace-access.typedefs';

export const authorizeOperator = (ctx: UseCaseCtx): WorkspaceAccess => {
  const permissions =
    ctx.permissions ??
    (ctx.workspaceRole === null ? new Set<string>() : permissionsForRole(ctx.workspaceRole));
  const resource = Object.values(OPERATOR_RESOURCE).find((candidate) =>
    hasPermission(permissions, candidate, PermissionAction.Edit),
  );
  return authorize(ctx, resource ?? PermissionResource.Inbox, PermissionAction.Edit);
};

export const operatorMessageKey = (messageId: string): string =>
  [OPERATOR_MESSAGE_KEY_PREFIX, messageId].join(OPERATOR_MESSAGE_KEY_SEPARATOR);
